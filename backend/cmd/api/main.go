package main

import (
	"net/http"

	"gopher-pay/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type CheckoutRequest struct {
	TotalCents int64 `json:"total_cents" binding:"required"`
}

func main() {
	// Configuración para producción/debug
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())

	// Inicializamos el servicio (arranca con Stock = 10)
	bnplService := service.NewBNPLService()

	// CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type"}
	r.Use(cors.New(config))

	api := r.Group("/api/v1")
	{
		// --- ESTA ES LA RUTA QUE TE FALTA ---
		api.GET("/stock", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"stock": bnplService.GetStock()})
		})

		// RUTA NUEVA: Reiniciar Stock
		api.POST("/stock/reset", func(c *gin.Context) {
			// Reiniciamos a 10 (o podrías recibir el número por JSON si quisieras)
			bnplService.ResetStock(10)
			c.JSON(http.StatusOK, gin.H{"message": "Stock reiniciado a 10"})
		})

		// --- ESTA TAMBIÉN ES NUEVA ---
		api.POST("/checkout", func(c *gin.Context) {
			var req CheckoutRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			result, err := bnplService.ProcessCheckout(req.TotalCents)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, result)
		})
	}

	println("Servidor Gopher-Pay listo en :8080. Stock inicial: 10")
	r.Run(":8080")
}
