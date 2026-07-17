import { Outlet } from 'react-router-dom';
import SettingsSidebar from './SettingsSidebar';

const SettingsLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SettingsSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsLayout;
