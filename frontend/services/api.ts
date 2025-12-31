import { Platform } from 'react-native';

// --- Configuración ---
const API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080/api/v1' 
  : 'http://localhost:8080/api/v1';

// --- Interfaces ---
export interface Installment {
  sequence: number;
  amount: number;
  due_date: string;
}

export interface CheckoutResult {
  status: "SUCCESS" | "FAILED";
  message: string;
  plan_id: string;
  total_amount?: number;
  installments?: Installment[];
}

// Alias de tipo para mantener compatibilidad con index.tsx
export type PaymentPlan = CheckoutResult; 


// --- Funciones API ---

// 1. Obtener Stock
export const getStock = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_URL}/stock`);
    const data = await response.json();
    return data.stock;
  } catch (error) {
    console.error("Error fetching stock:", error);
    return 0;
  }
};

// 2. Procesar Compra (Core Logic)
export const processCheckout = async (totalCents: number): Promise<CheckoutResult> => {
  try {
    const response = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total_cents: totalCents }),
    });
    const data = await response.json();
    
    // Safety check: Evita crashes si el plan_id viene nulo
    if (!data.plan_id) data.plan_id = ""; 
    
    return data as CheckoutResult;
  } catch (error) {
    console.error("Checkout error:", error);
    return { 
        status: "FAILED", 
        message: "Error de conexión con el servidor", 
        plan_id: "" 
    };
  }
};

// 3. Alias para la pantalla principal (index.tsx)
// Apunta directamente a processCheckout para evitar wrappers innecesarios
export const calculateInstallments = processCheckout;

// 4. Reiniciar Stock (Para pruebas)
export const resetStock = async (): Promise<void> => {
  try {
    await fetch(`${API_URL}/stock/reset`, { method: 'POST' });
  } catch (error) {
    console.error("Error resetting stock:", error);
  }
};