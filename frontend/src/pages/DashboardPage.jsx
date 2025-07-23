import React, { useState } from "react";
import { trackEvent } from "../utils/analytics";

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("workflows");

  const handleTabChange = (tabName) => {
    trackEvent('tab_click', 'navigation', `dashboard_${tabName}`, 1);
    setActiveTab(tabName);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="text-4xl font-semibold m-0">Dashboard</div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border-color">
        <button
          className={`bg-none py-3 px-5 cursor-pointer text-base font-medium transition-colors duration-200 ${
            activeTab === "workflows"
              ? "text-accent-text font-semibold border-b-2"
              : "text-text-secondary"
          } hover:text-text-primary`}
          onClick={() => handleTabChange("workflows")}
        >
          Workflows
        </button>
        <button
          className={`bg-none py-3 px-5 cursor-pointer text-base font-medium transition-colors duration-200 ${
            activeTab === "analytics"
              ? "text-accent-text font-semibold border-b-2"
              : "text-text-secondary"
          } hover:text-text-primary`}
          onClick={() => handleTabChange("analytics")}
        >
          Analytics
        </button>
      </div>

      <div className="flex-grow">
        {activeTab === "workflows" && (
          <div className="workflows-content">
            <div className="bg-bg-panel border border-border-color rounded-[12px] p-16 text-center">
              <h2 className="mt-0 text-xl text-text-primary">Workflows</h2>
              <p className="text-text-secondary max-w-[400px] mt-2 mx-auto mb-0">
                Workflow management coming soon.
              </p>
            </div>
          </div>
        )}
        {activeTab === "analytics" && (
          <div className="analytics-content">
            <div className="bg-bg-panel border border-border-color rounded-[12px] p-16 text-center">
              <h2 className="mt-0 text-xl text-text-primary">Analytics</h2>
              <p className="text-text-secondary max-w-[400px] mt-2 mx-auto mb-0">
                Analytics dashboard coming soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
