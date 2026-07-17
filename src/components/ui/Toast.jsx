const Toast = ({ toast }) => {
  if (!toast) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[toast.type];

  return (
    <div className={`fixed top-4 right-4 text-white px-4 py-2 rounded shadow-lg ${bgColor}`}>
      {toast.message}
    </div>
  );
};

export default Toast;
