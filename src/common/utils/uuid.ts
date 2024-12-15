import { v4 as uuidv4 } from 'uuid';


export function generateUniqueCode (): string {
  return uuidv4().replace(/-/g, "").substring(0, 25);
};