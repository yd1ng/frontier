import { Client, GatewayIntentBits, TextChannel, ForumChannel, ThreadChannel, Collection, Message, ChannelType } from 'discord.js';
import DiscordMessage from '../models/DiscordMessage';

class DiscordService {
  private client: Client | null = null;
  private isReady: boolean = false;
  private channels: Map<string, { id: string; name: string; type: string }> = new Map();

  constructor() {
    this.initializeBot();
  }

  private initializeBot() {
    const token = process.env.DISCORD_BOT_TOKEN;
    
    if (!token || token === 'your-discord-bot-token-here') {
      console.warn('⚠️  Discord Bot Token not configured. Discord features will be disabled.');
      return;
    }

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      this.client.once('ready', () => {
        console.log('✅ Discord Bot connected successfully');
        this.isReady = true;
        this.loadChannels();
        this.setupMessageListener();
      });

      this.client.on('error', (error) => {
        console.error('Discord client error:', error);
      });

      this.client.login(token).catch((error) => {
        console.error('Failed to login to Discord:', error);
      });
    } catch (error) {
      console.error('Failed to initialize Discord bot:', error);
    }
  }

  private loadChannels() {
    if (!this.client || !this.isReady) return;

    // 환경 변수에서 채널 설정 로드
    const missionChannelId = process.env.DISCORD_MISSION_CHANNEL;

    if (missionChannelId) {
      this.channels.set('mission', {
        id: missionChannelId,
        name: 'Missions',
        type: 'mission',
      });
    }
  }

  private setupMessageListener() {
    if (!this.client) return;

    // 새 스레드(포스트) 생성 이벤트
    this.client.on('threadCreate', async (thread) => {
      for (const [type, channelConfig] of this.channels.entries()) {
        if (thread.parentId === channelConfig.id) {
          console.log(`📝 New forum post created: ${thread.name}`);
          
          // 포스트의 첫 메시지만 가져오기 (댓글 제외)
          const starterMessage = await thread.fetchStarterMessage().catch(() => null);
          if (starterMessage && !starterMessage.author.bot) {
            await this.saveMessage(starterMessage, channelConfig);
          }
          break;
        }
      }
    });

    // 메시지 업데이트 이벤트 (포스트 수정)
    this.client.on('messageUpdate', async (oldMessage, newMessage) => {
      if (newMessage.author?.bot) return;

      // 포스트의 첫 메시지만 업데이트 (댓글은 무시)
      if (newMessage.channel.isThread()) {
        const thread = newMessage.channel as ThreadChannel;
        
        // starter message인지 확인
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);
        if (starterMessage && starterMessage.id === newMessage.id) {
          for (const [type, channelConfig] of this.channels.entries()) {
            if (thread.parentId === channelConfig.id) {
              console.log(`✏️ Forum post updated: ${thread.name}`);
              await this.saveMessage(newMessage as Message, channelConfig);
              break;
            }
          }
        }
      }
    });

    // 메시지 삭제 이벤트 (포스트 삭제)
    this.client.on('messageDelete', async (message) => {
      try {
        const deleted = await DiscordMessage.findOneAndDelete({ messageId: message.id });
        if (deleted) {
          console.log(`🗑️ Forum post deleted from DB: ${message.id}`);
        }
      } catch (error) {
        console.error('Failed to delete message from DB:', error);
      }
    });

    // 스레드 삭제 이벤트 (포스트 전체 삭제)
    this.client.on('threadDelete', async (thread) => {
      try {
        // 해당 스레드의 starter message 삭제
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);
        if (starterMessage) {
          await DiscordMessage.findOneAndDelete({ messageId: starterMessage.id });
          console.log(`🗑️ Forum post deleted: ${thread.name}`);
        }
      } catch (error) {
        console.error('Failed to delete forum post from DB:', error);
      }
    });

    console.log('👂 Discord message listener activated (Forum posts only, comments excluded)');
  }

  async fetchAndCacheMessages(channelType: 'announcement' | 'mission', limit: number = 20) {
    if (!this.client || !this.isReady) {
      throw new Error('Discord bot is not ready');
    }

    const channelConfig = this.channels.get(channelType);
    if (!channelConfig) {
      throw new Error(`Channel type '${channelType}' not configured`);
    }

    try {
      const channel = await this.client.channels.fetch(channelConfig.id);
      
      if (!channel) {
        throw new Error('Channel not found');
      }

      // Forum Channel (포스트 채널) 처리
      if (channel.type === ChannelType.GuildForum) {
        return await this.fetchForumPosts(channel as ForumChannel, channelConfig, limit);
      }
      
      // 일반 텍스트 채널 처리
      if (channel.isTextBased()) {
        const messages = await (channel as TextChannel).messages.fetch({ limit });
        const messageArray = Array.from(messages.values());

        for (const message of messageArray) {
          await this.saveMessage(message, channelConfig);
        }

        return messageArray.length;
      }

      throw new Error('Unsupported channel type');
    } catch (error) {
      console.error(`Failed to fetch messages from ${channelType}:`, error);
      throw error;
    }
  }

  private async fetchForumPosts(
    forumChannel: ForumChannel,
    channelConfig: { id: string; name: string; type: string },
    limit: number = 20
  ) {
    try {
      // 활성 스레드(포스트) 가져오기
      const threads = await forumChannel.threads.fetchActive();
      
      // 보관된 스레드도 가져오기
      const archivedThreads = await forumChannel.threads.fetchArchived({ limit }).catch(() => {
        console.log('⚠️ Could not fetch archived threads (permission issue or none exist)');
        return { threads: new Collection() };
      });
      
      // 모든 스레드 합치기
      const allThreads = new Collection([...threads.threads, ...archivedThreads.threads]);
      
      const threadArray = Array.from(allThreads.values()).slice(0, limit);
      const validMessageIds: string[] = [];
      let count = 0;

      for (const thread of threadArray) {
        // 각 스레드(포스트)의 첫 메시지(starter message)만 가져오기
        const starterMessage = await thread.fetchStarterMessage().catch(() => null);
        
        if (starterMessage) {
          await this.saveMessage(starterMessage, channelConfig);
          validMessageIds.push(starterMessage.id);
          count++;
        }
      }

      // DB에 있지만 Discord에 없는 포스트 삭제
      const deleteResult = await DiscordMessage.deleteMany({
        type: channelConfig.type,
        messageId: { $nin: validMessageIds }
      });

      if (deleteResult.deletedCount > 0) {
        console.log(`🗑️ Removed ${deleteResult.deletedCount} deleted posts from DB`);
      }

      console.log(`✅ Fetched ${count} forum posts (active + archived, comments excluded)`);
      return count;
    } catch (error) {
      console.error('Failed to fetch forum posts:', error);
      throw error;
    }
  }

  private async saveMessage(message: Message, channelConfig: { id: string; name: string; type: string }) {
    try {
      const messageData = {
        messageId: message.id,
        channelId: channelConfig.id,
        channelName: channelConfig.name,
        content: message.content,
        author: {
          username: message.author.username,
          avatar: message.author.displayAvatarURL(),
        },
        embeds: message.embeds.map((embed) => embed.toJSON()),
        attachments: message.attachments.map((attachment) => ({
          url: attachment.url,
          name: attachment.name,
          contentType: attachment.contentType,
        })),
        timestamp: message.createdAt,
        type: channelConfig.type,
      };

      await DiscordMessage.findOneAndUpdate(
        { messageId: message.id },
        messageData,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Failed to save Discord message:', error);
    }
  }

  async getMessages(type: 'announcement' | 'mission', limit: number = 20) {
    try {
      const messages = await DiscordMessage.find({ type })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return messages;
    } catch (error) {
      console.error(`Failed to get ${type} messages:`, error);
      throw error;
    }
  }

  async syncMessages() {
    if (!this.isReady) {
      console.warn('Discord bot is not ready. Skipping sync.');
      return { synced: false, message: 'Bot not ready' };
    }

    try {
      const results = {
        mission: 0,
      };

      if (this.channels.has('mission')) {
        results.mission = await this.fetchAndCacheMessages('mission', 50);
      }

      return { synced: true, results };
    } catch (error) {
      console.error('Failed to sync Discord messages:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isReady;
  }

  getConfiguredChannels() {
    return Array.from(this.channels.values());
  }

  // 자동 동기화 스케줄러 시작
  startAutoSync(intervalMinutes: number = 60) {
    if (!this.isReady) {
      console.warn('Discord bot is not ready. Auto-sync will not start.');
      return;
    }

    // 초기 동기화
    this.syncMessages().catch((error) => {
      console.error('Initial sync failed:', error);
    });

    // 주기적 동기화
    setInterval(async () => {
      try {
        console.log('🔄 Starting automatic Discord sync...');
        await this.syncMessages();
        console.log('✅ Automatic Discord sync completed');
      } catch (error) {
        console.error('❌ Automatic Discord sync failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`⏰ Discord auto-sync scheduled every ${intervalMinutes} minutes`);
  }
}

// 싱글톤 인스턴스
const discordService = new DiscordService();

export default discordService;

