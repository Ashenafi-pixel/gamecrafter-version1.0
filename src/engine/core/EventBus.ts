/**
 * EventBus - Central event system for the slot engine
 * Handles all engine-to-UI communication
 */

type EventCallback<T = any> = (data: T) => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Subscribe to an event
   */
  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
    
    if (this.debugMode) {
      console.log(`🔔 EventBus: Subscribed to '${event}'`);
    }
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off<T>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        if (this.debugMode) {
          console.log(`🔕 EventBus: Unsubscribed from '${event}'`);
        }
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    
    if (this.debugMode) {
      console.log(`📢 EventBus: Emitting '${event}'`, data);
    }
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for '${event}':`, error);
        }
      });
    }
  }

  /**
   * One-time event subscription
   */
  once<T>(event: string, callback: EventCallback<T>): void {
    const onceCallback = (data: T) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Remove all listeners for an event or all events
   */
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      if (this.debugMode) {
        console.log(`🧹 EventBus: Cleared listeners for '${event}'`);
      }
    } else {
      this.listeners.clear();
      if (this.debugMode) {
        console.log(`🧹 EventBus: Cleared all listeners`);
      }
    }
  }

  /**
   * Get debug info about current listeners
   */
  getListenerInfo(): Record<string, number> {
    const info: Record<string, number> = {};
    this.listeners.forEach((callbacks, event) => {
      info[event] = callbacks.length;
    });
    return info;
  }
}