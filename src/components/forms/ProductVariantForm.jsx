import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Card from '../ui/Card';

const ProductVariantForm = ({ variants = [], onChange }) => {
  const [attributes, setAttributes] = useState([
    { name: 'Color', values: ['Red', 'Blue', 'Green'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
  ]);

  const generateMatrix = () => {
    if (attributes.length === 0) return [];
    
    const matrix = [];
    const generateCombinations = (current, depth) => {
      if (depth === attributes.length) {
        matrix.push([...current]);
        return;
      }
      const attr = attributes[depth];
      attr.values.forEach((value) => {
        current.push({ attribute: attr.name, value });
        generateCombinations(current, depth + 1);
        current.pop();
      });
    };
    generateCombinations([], 0);
    return matrix;
  };

  const variantMatrix = generateMatrix();

  const updateVariant = (index, field, value) => {
    const updated = [...(variants || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addAttribute = () => {
    setAttributes([...attributes, { name: '', values: [] }]);
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttributeName = (index, name) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], name };
    setAttributes(updated);
  };

  const updateAttributeValue = (attrIndex, valueIndex, value) => {
    const updated = [...attributes];
    updated[attrIndex] = {
      ...updated[attrIndex],
      values: updated[attrIndex].values.map((v, i) => (i === valueIndex ? value : v)),
    };
    setAttributes(updated);
  };

  const addAttributeValue = (attrIndex) => {
    const updated = [...attributes];
    updated[attrIndex] = { ...updated[attrIndex], values: [...updated[attrIndex].values, ''] };
    setAttributes(updated);
  };

  const removeAttributeValue = (attrIndex, valueIndex) => {
    const updated = [...attributes];
    updated[attrIndex] = {
      ...updated[attrIndex],
      values: updated[attrIndex].values.filter((_, i) => i !== valueIndex),
    };
    setAttributes(updated);
  };

  return (
    <div className="space-y-6">
      {/* Attributes Configuration */}
      <Card>
        <h3 className="text-sm font-bold text-slate-800 mb-4">Variant Attributes</h3>
        <div className="space-y-4">
          {attributes.map((attr, attrIndex) => (
            <div key={attrIndex} className="border border-slate-200 rounded-[12px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttributeName(attrIndex, e.target.value)}
                  placeholder="Attribute name (e.g., Color)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(attrIndex)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {attr.values.map((value, valueIndex) => (
                  <div key={valueIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateAttributeValue(attrIndex, valueIndex, e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                      className="w-6 h-6 rounded flex items-center justify-center text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addAttributeValue(attrIndex)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Value
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addAttribute}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-600 hover:border-slate-400 hover:text-slate-700"
          >
            <Plus size={16} />
            Add Attribute
          </button>
        </div>
      </Card>

      {/* Variant Matrix */}
      {variantMatrix.length > 0 && (
        <Card>
          <h3 className="text-sm font-bold text-slate-800 mb-4">Variant Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  {attributes.map((attr) => (
                    <th key={attr.name} className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">{attr.name}</th>
                  ))}
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Price</th>
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Stock</th>
                </tr>
              </thead>
              <tbody>
                {variantMatrix.map((combo, index) => (
                  <tr key={index} className="border-b border-slate-50">
                    {combo.map((item, i) => (
                      <td key={i} className="px-4 py-2 text-xs text-slate-700">{item.value}</td>
                    ))}
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={variants[index]?.sku || ''}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="SKU"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={variants[index]?.price || ''}
                        onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={variants[index]?.stock || ''}
                        onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProductVariantForm;
