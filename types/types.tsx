// Tipagens do projeto

// Tipagem da página de Index, Novo
export type Category = {
  id: number;
  category: string;
  created_at: string;
  updated_at: string;
  pivot: {
    report_id: number;
    category_id: number;
  };
};
export type Status = {
  id: number;
  status: string;
  created_at: string;
  updated_at: string;
};
export type UserReport = {
  id: number;
  location: string;
  photo: string | null;
  date: string;
  user_id: number;
  status_id: number;
  created_at: string;
  comment:string
  updated_at: string;
  photo_url: string;
  status: Status;
  categories: Category[];
};
