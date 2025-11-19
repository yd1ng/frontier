interface CategoryTab {
  value: string;
  label: string;
}

interface CategoryTabsProps {
  tabs: CategoryTab[];
  activeTab: string;
  onChange: (value: string) => void;
}

const CategoryTabs = ({ tabs, activeTab, onChange }: CategoryTabsProps) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === tab.value
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CategoryTabs;

