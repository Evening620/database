export const ITEM_TEMPLATE_OPTIONS = [
  {
    id: "book_set",
    label: "教材套装",
    itemName: "DataStructureNotes",
    category: "Book",
    price: 26,
  },
  {
    id: "dorm_life",
    label: "宿舍好物",
    itemName: "MiniFan",
    category: "DailyGoods",
    price: 32,
  },
  {
    id: "electronics",
    label: "电子配件",
    itemName: "MechanicalKeyboard",
    category: "Electronics",
    price: 88,
  },
  {
    id: "furniture",
    label: "小件家具",
    itemName: "FoldableRack",
    category: "Furniture",
    price: 45,
  },
] as const;

export const QUICK_PRICE_OPTIONS = [12, 20, 35, 50, 66, 88];

export function getItemTemplateById(templateId: string) {
  return ITEM_TEMPLATE_OPTIONS.find((template) => template.id === templateId);
}
