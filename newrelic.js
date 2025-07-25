/**
 * New Relic agent configuration.
 *
 * This configuration file is used to configure the New Relic agent.
 * Copy this file to the root directory of your Node.js application
 * and name it 'newrelic.js'. For more information on configuration
 * options, see: https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration
 */
'use strict'

/**
 * Array of application names.
 */
exports.config = {
  /**
   * Application identifier(s).
   */
  app_name: ['Second Chance Platform'],
  
  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  
  /**
   * This setting controls distributed tracing.
   * Distributed tracing lets you see the path that a request takes through your
   * distributed system. Enabling distributed tracing changes the behavior of some
   * New Relic features, so carefully consult the transition guide before you enable
   * this feature: https://docs.newrelic.com/docs/transition-guide-distributed-tracing
   * Default is true.
   */
  distributed_tracing: {
    enabled: true
  },
  
  /**
   * Logging configuration
   */
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
  },
  
  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,
  
  /**
   * Attributes configuration
   */
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end.
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*'
    ]
  },
  
  /**
   * Browser monitoring configuration
   */
  browser_monitoring: {
    enable: true
  },
  
  /**
   * Application performance monitoring
   */
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true
    },
    metrics: {
      enabled: true
    },
    local_decorating: {
      enabled: true
    }
  },
  
  /**
   * Error collection configuration
   */
  error_collector: {
    enabled: true,
    ignore_status_codes: [404]
  },
  
  /**
   * Transaction tracer configuration
   */
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
    record_sql: 'obfuscated',
    explain_threshold: 500
  },
  
  /**
   * Slow SQL configuration
   */
  slow_sql: {
    enabled: true
  },
  
  /**
   * Custom insights events
   */
  custom_insights_events: {
    enabled: true
  }
}