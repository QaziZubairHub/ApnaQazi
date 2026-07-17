const RichTextEditor = ({ label, value, onChange, placeholder = "Enter content here..." }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <div className="border border-slate-200 rounded-[12px] overflow-hidden bg-white">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => onChange((value || '') + '**bold text**')}
            className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => onChange((value || '') + '*italic text*')}
            className="px-2 py-1 text-xs italic text-slate-600 hover:bg-slate-200 rounded"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => onChange((value || '') + '\n- List item')}
            className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
          >
            •
          </button>
          <span className="text-[10px] text-slate-400 ml-2">Markdown supported</span>
        </div>
        <textarea
          value={value || ''}
          onChange={handleChange}
          rows={6}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none resize-y"
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">Use Markdown formatting: **bold**, *italic*, - bullet lists</p>
    </div>
  );
};

export default RichTextEditor;
