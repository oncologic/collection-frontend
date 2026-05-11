export const Tabs = ({
  children,
  activeTab,
  onChange,
  fontSize = "text-sm",
}) => {
  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {children.map((tab) => (
            <button
              key={tab.props.id}
              onClick={() => onChange(tab.props.id)}
              className={`
                  ${
                    activeTab === tab.props.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium ${fontSize}
                `}
            >
              {tab.props.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {children.find((tab) => tab.props.id === activeTab)}
      </div>
    </div>
  );
};

export const Tab = ({ children }) => children;
