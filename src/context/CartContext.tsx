import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext<any>(null);

export function CartProvider({children}:{children:React.ReactNode}){
 const [items,setItems]=useState<any[]>([]);
 useEffect(()=>{
  const saved=localStorage.getItem('jango_cart');
  if(saved) setItems(JSON.parse(saved));
 },[]);
 useEffect(()=>{
  localStorage.setItem('jango_cart',JSON.stringify(items));
 },[items]);
 const addToCart=(product:any)=>setItems(prev=>[...prev,product]);
 return <CartContext.Provider value={{items,addToCart}}>{children}</CartContext.Provider>
}
export function useCart(){return useContext(CartContext)}
