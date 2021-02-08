package watchdog

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/TwinProduction/gatus/config"
	"github.com/TwinProduction/gatus/core"
	"github.com/TwinProduction/gatus/metric"
)

const (
	defaultGroupName = "unknown"
	failingGroupName = "failing"
)

var (
	servicesGroupedByLabel = make(map[string]map[string][]*core.Result)

	// serviceResultsMutex is used to prevent concurrent map access
	serviceResultsMutex sync.RWMutex

	// monitoringMutex is used to prevent multiple services from being evaluated at the same time.
	// Without this, conditions using response time may become inaccurate.
	monitoringMutex sync.Mutex
)

// GetJSONEncodedServiceResults returns a list of the last 20 results for each services encoded using json.Marshal.
// The reason why the encoding is done here is because we use a mutex to prevent concurrent map access.
func GetJSONEncodedServiceResults() ([]byte, error) {
	serviceResultsMutex.RLock()
	data, err := json.Marshal(servicesGroupedByLabel)
	serviceResultsMutex.RUnlock()
	return data, err
}

// Monitor loops over each services and starts a goroutine to monitor each services separately
func Monitor(cfg *config.Config) {
	for _, service := range cfg.Services {
		go monitor(service)
		// To prevent multiple requests from running at the same time
		time.Sleep(1111 * time.Millisecond)
	}
}

// monitor monitors a single service in a loop

func appendStatusResult(groupedServices map[string]map[string][]*core.Result, service *core.Service, serviceLabel string, result *core.Result) {
	if _, ok := groupedServices[serviceLabel]; !ok {
		groupedServices[serviceLabel] = map[string][]*core.Result{
			service.Name: {
				result,
			},
		}
	} else {
		bucket := groupedServices[serviceLabel]
		bucket[service.Name] = append(bucket[service.Name], result)
		if len(bucket[service.Name]) > 20 {
			bucket[service.Name] = bucket[service.Name][1:]
		}
	}
}

func monitor(service *core.Service) {
	cfg := config.Get()
	for {
		if !cfg.DisableMonitoringLock {
			// By placing the lock here, we prevent multiple services from being monitored at the exact same time, which
			// could cause performance issues and return inaccurate results
			monitoringMutex.Lock()
		}
		if cfg.Debug {
			log.Printf("[watchdog][monitor] Monitoring serviceName=%s", service.Name)
		}
		result := service.EvaluateHealth()
		metric.PublishMetricsForService(service, result)
		serviceResultsMutex.Lock()

		serviceLabel := defaultGroupName

		if service.Label != "" {
			serviceLabel = service.Label
		}

		appendStatusResult(servicesGroupedByLabel, service, serviceLabel, result)

		if !result.Success {
			appendStatusResult(servicesGroupedByLabel, service, failingGroupName, result)
		}

		serviceResultsMutex.Unlock()
		var extra string
		if !result.Success {
			extra = fmt.Sprintf("responseBody=%s", result.Body)
		}
		log.Printf(
			"[watchdog][monitor] Monitored serviceName=%s; label=%v; success=%v; errors=%d; requestDuration=%s; %s",
			service.Name,
			serviceLabel,
			result.Success,
			len(result.Errors),
			result.Duration.Round(time.Millisecond),
			extra,
		)
		HandleAlerting(service, result)
		if cfg.Debug {
			log.Printf("[watchdog][monitor] Waiting for interval=%s before monitoring serviceName=%s again", service.Interval, service.Name)
		}
		if !cfg.DisableMonitoringLock {
			monitoringMutex.Unlock()
		}
		time.Sleep(service.Interval)
	}
}
