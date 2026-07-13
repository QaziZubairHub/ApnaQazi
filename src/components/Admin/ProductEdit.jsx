import ProductUpsert from "./ProductUpsert";
import { useParams } from "react-router-dom";

export default function ProductEdit() {
  // ProductUpsert reads params.id itself; this wrapper just renders it.
  // Keeping this file for module routes / clarity.
  // eslint-disable-next-line react/prop-types
  const _ = useParams();
  return <ProductUpsert mode="edit" />;
}

