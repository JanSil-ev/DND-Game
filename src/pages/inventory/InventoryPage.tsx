import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import { Inventory } from '../../modules/inventory/ui/Inventory';

export function InventoryPage() {
  return (
    <PageFrame
      eyebrow="Снаряжение группы"
      title="Инвентарь и трофеи"
      description="Всё, что герои несут с собой в поход и возвращают из подземелий."
    >
      <Inventory />
    </PageFrame>
  );
}
