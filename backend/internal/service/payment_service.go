package service

import (
	"fmt"
	"sync"
	"time"
)

// PaymentPlan representa el desglose de las cuotas
type PaymentPlan struct {
	PlanID       string        `json:"plan_id"`
	TotalAmount  int64         `json:"total_amount"`
	Installments []Installment `json:"installments"`
	Status       string        `json:"status"` // "SUCCESS" o "FAILED"
	Message      string        `json:"message"`
}

type Installment struct {
	Sequence int       `json:"sequence"`
	Amount   int64     `json:"amount"`
	DueDate  time.Time `json:"due_date"`
}

type BNPLService struct {
	mu           sync.Mutex // El "candado" de seguridad
	CurrentStock int        // Stock en memoria RAM
}

// Inicializamos el servicio con 10 productos en stock
func NewBNPLService() *BNPLService {
	return &BNPLService{
		CurrentStock: 10,
	}
}

// GetStock simplemente devuelve el stock actual de forma segura
func (s *BNPLService) GetStock() int {
	// Incluso para leer, usamos un lock rápido para evitar lecturas sucias
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.CurrentStock
}

// ProcessCheckout intenta comprar un producto y calcular cuotas.
// ESTA ES LA FUNCIÓN CRÍTICA DE CONCURRENCIA.
func (s *BNPLService) ProcessCheckout(totalCents int64) (*PaymentPlan, error) {
	// 1. Echar cerrojo. Nadie más pasa de esta línea hasta que terminemos.
	s.mu.Lock()
	// 2. Aseguramos que el cerrojo se abra al terminar la función, pase lo que pase.
	defer s.mu.Unlock()

	// --- ZONA CRÍTICA (Solo entra un usuario a la vez) ---

	fmt.Printf("Procesando pedido... Stock actual: %d\n", s.CurrentStock)
	// Simulamos una pequeña latencia de procesamiento (base de datos, tarjeta de crédito)
	time.Sleep(50 * time.Millisecond)

	if s.CurrentStock <= 0 {
		// Si no hay stock, fallamos.
		fmt.Println("-> Rechazado: Sin Stock")
		return &PaymentPlan{
			Status:  "FAILED",
			Message: "Lo sentimos, producto agotado.",
		}, nil
	}

	// Si hay stock, restamos uno.
	s.CurrentStock--
	fmt.Printf("-> Aprobado. Nuevo stock: %d\n", s.CurrentStock)

	// --- FIN ZONA CRÍTICA ---

	// La matemática ya se puede hacer fuera de la zona crítica si quisieramos,
	// pero para este ejemplo la mantenemos dentro para simplificar.
	const parts = 4
	baseAmount := totalCents / parts
	remainder := totalCents % parts
	installments := make([]Installment, parts)
	now := time.Now()

	for i := 0; i < parts; i++ {
		amount := baseAmount
		if i == 0 {
			amount += remainder
		}
		installments[i] = Installment{
			Sequence: i + 1,
			Amount:   amount,
			DueDate:  now.AddDate(0, 0, i*14),
		}
	}

	return &PaymentPlan{
		PlanID:       "plan_" + now.Format("150405.000"),
		TotalAmount:  totalCents,
		Installments: installments,
		Status:       "SUCCESS",
		Message:      "Compra exitosa.",
	}, nil
}

// ResetStock reinicia el inventario a una cantidad específica de forma segura
func (s *BNPLService) ResetStock(amount int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.CurrentStock = amount
	fmt.Printf("--- STOCK REINICIADO MANUALMENTE A %d ---\n", amount)
}
