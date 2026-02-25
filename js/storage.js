export const STORAGE_KEY = "warlock_sheet_v1";

export function loadFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{
    return null;
  }
}

export function saveToStorage(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
