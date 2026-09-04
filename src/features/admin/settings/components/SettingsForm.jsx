import Card from '../../../../components/ui/Card';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

const SettingsForm = ({ title, description, children, footer, loading = false }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>

      {loading ? (
        <Card>
          <div className="flex justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        </Card>
      ) : (
        <>
          {children}
          {footer && (
            <div className="flex justify-end">
              {footer}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsForm;
