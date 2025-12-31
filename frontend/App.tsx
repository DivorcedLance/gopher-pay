import "./global.css"; 
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
// Asegúrate de que la ruta a api.ts sea correcta. Si api.ts está en una carpeta services:
import { calculateInstallments, PaymentPlan, getStock, processCheckout, resetStock } from './services/api'; 

// --- PANTALLA 1: HOME (TIENDA) ---
const HomeScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const PRODUCT_PRICE_CENTS = 14000;

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const result = await calculateInstallments(PRODUCT_PRICE_CENTS);
      if (result.status === 'SUCCESS' && result.installments) {
        setPlan(result);
      } else {
        Alert.alert("¡Ups! Producto Agotado", result.message || "No queda stock disponible.");
      }
    } catch (error) {
      Alert.alert("Error de Conexión", "No pudimos conectar con Gopher-Pay.");
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => setPlan(null);

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        {/* HEADER */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-4">
            <Text className="text-white text-lg font-bold tracking-widest">NIKE STORE</Text>
            <View className="bg-gray-800 p-2 rounded-full">
                <Text className="text-white text-xs">🛒 0</Text>
            </View>
        </View>

        {!plan ? (
            <View className="px-6">
                {/* Imagen del Producto */}
                <View className="w-full h-80 bg-gray-800 rounded-3xl items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                    <View className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full z-10">
                        <Text className="font-bold text-xs text-black">BEST SELLER</Text>
                    </View>
                    <Text className="text-9xl">👟</Text>
                </View>

                {/* Detalles */}
                <View className="mb-6">
                    <Text className="text-gray-400 font-medium tracking-widest text-xs mb-1">RUNNING / LIFESTYLE</Text>
                    <Text className="text-white text-3xl font-extrabold mb-2">Air Jordan 1 Retro</Text>
                    <Text className="text-gray-400 leading-6">
                        El clásico que lo inició todo.
                    </Text>
                </View>

                {/* Precio */}
                <View className="flex-row items-end justify-between mb-8">
                    <View>
                        <Text className="text-gray-400 text-xs mb-1">Precio Total</Text>
                        <Text className="text-white text-3xl font-bold">{formatMoney(PRODUCT_PRICE_CENTS)}</Text>
                    </View>
                </View>

                {/* BOTÓN DE COMPRA (Sin animaciones 'scale' ni 'transition') */}
                <Pressable 
                    onPress={handlePurchase}
                    disabled={loading}
                    // Se quitaron: active:scale-95, transition-transform
                    className={`py-5 rounded-2xl items-center shadow-lg ${loading ? 'bg-gray-700' : 'bg-white'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <View className="flex-row items-center">
                            <Text className="mr-2 text-xl">🐹</Text>
                            <Text className="text-black font-bold text-lg">Pagar con Gopher-Pay</Text>
                        </View>
                    )}
                </Pressable>
            </View>
        ) : (
            // VISTA DE RECIBO
            <View className="px-6 pt-4">
                <View className="bg-green-500/10 border border-green-500/50 p-6 rounded-3xl mb-6 items-center">
                    <Text className="text-white text-2xl font-bold mb-1">¡Compra Exitosa!</Text>
                    <Text className="text-green-300 text-sm mb-4">Orden #{plan.plan_id.slice(-6)}</Text>
                </View>

                <View className="bg-gray-800 rounded-3xl p-6 mb-6">
                    <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">Calendario de Pagos</Text>
                    {plan.installments?.map((inst, index) => (
                        <View key={inst.sequence} className="flex-row items-center mb-6 last:mb-0">
                            <View className={`h-4 w-4 rounded-full mr-4 ${index === 0 ? 'bg-green-500' : 'bg-gray-600'}`} />
                            <View className="flex-1 flex-row justify-between items-center">
                                <Text className={`font-bold text-lg ${index === 0 ? 'text-white' : 'text-gray-400'}`}>
                                    {index === 0 ? "Pagado Hoy" : `Cuota ${index + 1}`}
                                </Text>
                                <Text className={`font-mono text-lg ${index === 0 ? 'text-green-400 font-bold' : 'text-gray-500'}`}>
                                    {formatMoney(inst.amount)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Pressable onPress={resetView} className="bg-gray-800 py-4 rounded-xl items-center mb-10">
                    <Text className="text-white font-bold">Seguir Comprando</Text>
                </Pressable>
            </View>
        )}
      </ScrollView>

      {/* BOTÓN FLOTANTE (Footer) */}
      <View className="absolute bottom-10 left-0 right-0 items-center">
         <Pressable 
            onPress={() => onNavigate('stress')}
            className="bg-gray-800/90 border border-gray-700 px-6 py-3 rounded-full flex-row items-center"
         >
            <Text className="mr-2">🔥</Text>
            <Text className="text-gray-300 font-bold text-xs uppercase">Simular Tráfico</Text>
         </Pressable>
      </View>
    </View>
  );
};

// --- PANTALLA 2: STRESS TEST ---
const StressScreen = ({ onBack }: { onBack: () => void }) => {
  const [stock, setStock] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { refreshStock(); }, []);

  const refreshStock = async () => {
    const s = await getStock();
    setStock(s);
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [msg, ...prev]);
  };

  const simulateMassiveTraffic = async () => {
    setLoading(true);
    setLogs([]);
    addLog("🚀 INICIANDO ATAQUE: 25 Usuarios...");
    
    const requests = [];
    for (let i = 1; i <= 25; i++) {
      requests.push(processCheckout(14000).then((result) => ({ user: i, result })));
    }
    const responses = await Promise.all(requests);
    let successCount = 0;
    responses.forEach(({ user, result }) => {
      if (result.status === 'SUCCESS') {
        successCount++;
        addLog(`✅ User ${user}: COMPRADO`);
      } else {
        addLog(`❌ User ${user}: Falló`);
      }
    });
    addLog(`🏁 FIN. Vendidos: ${successCount}.`);
    await refreshStock();
    setLoading(false);
  };

  const handleReset = async () => {
    await resetStock();
    await refreshStock();
    addLog("🔄 Stock reiniciado a 10.");
  };

  return (
    <View className="flex-1 bg-slate-900 pt-12 px-4">
      <Pressable onPress={onBack} className="mb-4 pt-4">
         <Text className="text-blue-400 font-bold text-lg">← Volver a Tienda</Text>
      </Pressable>
      
      <View className="items-center mb-6">
        <Text className="text-white text-2xl font-bold">Black Friday Sim</Text>
      </View>

      <View className="bg-slate-800 p-6 rounded-2xl mb-6 border-2 border-blue-500 items-center">
        <Text className="text-slate-400 text-sm font-bold mb-2">STOCK EN RAM</Text>
        <Text className={`text-6xl font-extrabold ${stock > 0 ? 'text-green-400' : 'text-red-500'}`}>
          {stock}
        </Text>
      </View>

       {/* Botón de Ataque (Sin animaciones complejas) */}
       <Pressable 
          onPress={simulateMassiveTraffic}
          disabled={loading || stock === 0}
          className={`py-4 rounded-xl items-center mb-4 border-b-4 ${stock === 0 ? 'bg-red-900 border-red-900' : 'bg-orange-600 border-orange-800'}`}
        >
            {loading ? <ActivityIndicator color="white"/> : <Text className="text-white font-bold">🔥 SIMULAR ATAQUE 🔥</Text>}
        </Pressable>
       
        {/* Botón Reset */}
        <Pressable onPress={handleReset} className="mb-6 bg-slate-700 p-3 rounded-lg items-center border border-slate-600">
            <Text className="text-blue-100 font-bold">🔄 Reiniciar Stock</Text>
        </Pressable>

      <ScrollView className="flex-1 bg-black rounded-xl p-4 border border-slate-700">
          {logs.map((log, index) => (
            <Text key={index} className={`font-mono text-xs mb-1 ${log.includes('✅') ? 'text-green-400' : 'text-slate-300'}`}>{log}</Text>
          ))}
      </ScrollView>
    </View>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar style="light" />
      {currentScreen === 'home' ? (
        <HomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />
      ) : (
        <StressScreen onBack={() => setCurrentScreen('home')} />
      )}
    </View>
  );
}