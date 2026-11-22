export interface IBaseRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(query?: any): Promise<{ list: T[]; total: number }>;
  create(entity: Partial<T>): Promise<T>;
  update(id: number, entity: Partial<T>): Promise<T | null>;
  remove(id: number): Promise<void>;
}
