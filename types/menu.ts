export interface Menu {
  id: number;
  parent_id: number | null;
  name: string;
  url: string;
  icon: string;
  module: string;
  permission_id: number | null;
  order_index: number;
  is_active: boolean;
  children?: Menu[];
}

export interface CreateMenuPayload {
  name: string;
  url: string;
  icon?: string;
  module: string;
  parent_id?: number | null;
  permission_id?: number | null;
  order_index?: number;
  is_active?: boolean;
}

export type UpdateMenuPayload = Partial<CreateMenuPayload>;
