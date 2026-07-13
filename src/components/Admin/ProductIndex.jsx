import Card from "../ui/Card";

import ProductList from "./ProductList";

const ProductIndex = () => {
  // Wrapper to keep admin product module isolated.
  return (
    <Card padding={false} hover={false} className="border-0 bg-transparent">
      <ProductList />
    </Card>
  );
};

export default ProductIndex;


