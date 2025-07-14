import { DynamicHeader } from "@/components/DynamicComponents";

function SettingsComponent() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-cyan-400 mb-8">Settings</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-cyan-500/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Account Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notification Preferences
            </label>
            <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
              <option>All notifications</option>
              <option>Important only</option>
              <option>None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Currency
            </label>
            <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
              <option>USD</option>
              <option>ETH</option>
              <option>USDC</option>
            </select>
          </div>
          <div className="pt-4">
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <DynamicHeader />
      <main className="container mx-auto px-4 py-8">
        <SettingsComponent />
      </main>
    </>
  );
}
