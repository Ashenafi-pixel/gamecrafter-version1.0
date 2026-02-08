// Web Worker Manager for professional mesh processing
// Handles worker lifecycle, communication, and performance optimization

interface WorkerTask {
  id: string;
  type: 'PROCESS_MESH' | 'TRIANGULATE' | 'SIMPLIFY' | 'CALCULATE_PROPERTIES';
  data: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface WorkerResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR';
  data?: any;
  error?: string;
}

export class WebWorkerManager {
  private static instance: WebWorkerManager;
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private taskQueue: WorkerTask[] = [];
  private pendingTasks: Map<string, WorkerTask> = new Map();
  private maxWorkers: number;
  private taskIdCounter = 0;

  constructor(maxWorkers: number = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers
    console.log(`🔧 WebWorker Manager initialized with ${this.maxWorkers} max workers`);
  }

  public static getInstance(maxWorkers?: number): WebWorkerManager {
    if (!WebWorkerManager.instance) {
      WebWorkerManager.instance = new WebWorkerManager(maxWorkers);
    }
    return WebWorkerManager.instance;
  }

  /**
   * Initialize worker pool
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing WebWorker pool...');

    try {
      // Create initial workers (start with 2, scale up as needed)
      const initialWorkerCount = Math.min(2, this.maxWorkers);

      for (let i = 0; i < initialWorkerCount; i++) {
        await this.createWorker();
      }

      console.log(`✅ WebWorker pool initialized with ${this.workers.length} workers`);
    } catch (error) {
      console.error('❌ Failed to initialize WebWorker pool:', error);
      throw error;
    }
  }

  /**
   * Create a new worker instance
   */
  private async createWorker(): Promise<Worker> {
    return new Promise((resolve, reject) => {
      try {
        // Create worker from our mesh processing worker
        const worker = new Worker(
          new URL('./meshProcessingWorker.ts', import.meta.url),
          { type: 'module' }
        );

        // Set up message handling
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          this.handleWorkerMessage(worker, event.data);
        };

        worker.onerror = (error) => {
          console.error('❌ Worker error:', error);
          this.handleWorkerError(worker, error);
        };

        worker.onmessageerror = (error) => {
          console.error('❌ Worker message error:', error);
          this.handleWorkerError(worker, error);
        };

        // Add to pools
        this.workers.push(worker);
        this.availableWorkers.push(worker);

        console.log(`👷 Worker ${this.workers.length} created and ready`);
        resolve(worker);

      } catch (error) {
        console.error('❌ Failed to create worker:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle worker message responses
   */
  private handleWorkerMessage(worker: Worker, response: WorkerResponse): void {
    console.log(`📥 Received worker response:`, response);
    const { id, type, data, error } = response;

    // Find the pending task
    const task = this.pendingTasks.get(id);
    if (!task) {
      console.warn(`⚠️ Received response for unknown task: ${id}`);
      console.log(`📊 Pending tasks:`, Array.from(this.pendingTasks.keys()));
      return;
    }

    // Remove from pending tasks
    this.pendingTasks.delete(id);

    // Mark worker as available
    this.busyWorkers.delete(worker);
    this.availableWorkers.push(worker);

    // Calculate task duration
    const duration = Date.now() - task.timestamp;
    console.log(`⏱️ Task ${id} completed in ${duration}ms (type: ${type})`);

    // Resolve or reject the task
    if (type === 'SUCCESS') {
      console.log(`✅ Task ${id} succeeded with data:`, data);
      task.resolve(data);
    } else {
      console.error(`❌ Task ${id} failed with error:`, error);
      task.reject(new Error(error || 'Unknown worker error'));
    }

    // Process next task in queue
    console.log(`🔄 Processing next task after completion...`);
    this.processNextTask();
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(worker: Worker, error: any): void {
    console.error('❌ Worker encountered error:', error);

    // Find and reject any pending tasks for this worker
    for (const [taskId, task] of this.pendingTasks.entries()) {
      // If this worker was handling the task, reject it
      task.reject(new Error(`Worker error: ${error.message || error}`));
      this.pendingTasks.delete(taskId);
    }

    // Remove worker from pools
    this.removeWorker(worker);

    // Try to create a replacement worker
    this.createWorker().catch(err => {
      console.error('❌ Failed to create replacement worker:', err);
    });
  }

  /**
   * Remove a worker from all pools
   */
  private removeWorker(worker: Worker): void {
    this.workers = this.workers.filter(w => w !== worker);
    this.availableWorkers = this.availableWorkers.filter(w => w !== worker);
    this.busyWorkers.delete(worker);

    try {
      worker.terminate();
    } catch (error) {
      console.warn('⚠️ Error terminating worker:', error);
    }
  }

  /**
   * Process the next task in the queue
   */
  private processNextTask(): void {
    console.log(`🔄 Processing next task. Queue: ${this.taskQueue.length}, Available: ${this.availableWorkers.length}, Busy: ${this.busyWorkers.size}`);

    if (this.taskQueue.length === 0) {
      console.log(`⏸️ No tasks in queue`);
      return;
    }

    if (this.availableWorkers.length === 0) {
      console.log(`⏸️ No available workers. Busy: ${this.busyWorkers.size}/${this.workers.length}`);
      return;
    }

    const task = this.taskQueue.shift()!;
    const worker = this.availableWorkers.shift()!;

    // Mark worker as busy
    this.busyWorkers.add(worker);

    // Add to pending tasks
    this.pendingTasks.set(task.id, task);

    console.log(`🔧 Dispatching task ${task.id} (${task.type}) to worker...`);
    console.log(`📊 Data size: ${JSON.stringify(task.data).length} characters`);

    // Send task to worker
    try {
      worker.postMessage({
        id: task.id,
        type: task.type,
        data: task.data
      });
      console.log(`✅ Task ${task.id} dispatched successfully`);
    } catch (error) {
      console.error(`❌ Failed to dispatch task ${task.id}:`, error);
      // Return worker to available pool
      this.busyWorkers.delete(worker);
      this.availableWorkers.push(worker);
      this.pendingTasks.delete(task.id);
      task.reject(new Error(`Failed to dispatch task: ${(error as any).message}`));
    }
  }

  /**
   * Execute a task using the worker pool
   */
  public async executeTask<T>(
    type: 'PROCESS_MESH' | 'TRIANGULATE' | 'SIMPLIFY' | 'CALCULATE_PROPERTIES',
    data: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;

      const task: WorkerTask = {
        id: taskId,
        type,
        data,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Add to queue
      this.taskQueue.push(task);
      console.log(`📝 Queued task ${taskId} (${type}). Queue size: ${this.taskQueue.length}`);

      // If we have available workers, process immediately
      if (this.availableWorkers.length > 0) {
        this.processNextTask();
      }
      // If queue is getting large and we can create more workers, do it
      else if (this.taskQueue.length > 2 && this.workers.length < this.maxWorkers) {
        console.log(`🔄 Queue growing, creating additional worker...`);
        this.createWorker().then(() => {
          this.processNextTask();
        }).catch(error => {
          console.error('❌ Failed to create additional worker:', error);
        });
      }
    });
  }

  /**
   * Process mesh with surgical precision using worker
   */
  public async processMesh(
    contourPoints: Array<{ x: number, y: number }>,
    elementType: string,
    imageWidth: number = 400,
    imageHeight: number = 400
  ): Promise<unknown> {
    console.log(`🔬 Processing mesh for ${elementType} using WebWorker...`);

    return this.executeTask('PROCESS_MESH', {
      contourPoints,
      elementType,
      imageWidth,
      imageHeight
    });
  }

  /**
   * Triangulate points using worker
   */
  public async triangulate(points: Array<{ x: number, y: number }>): Promise<number[]> {
    console.log(`🔺 Triangulating ${points.length} points using WebWorker...`);

    return this.executeTask('TRIANGULATE', points);
  }

  /**
   * Simplify mesh using worker
   */
  public async simplifyMesh(
    points: Array<{ x: number, y: number }>,
    targetCount: number
  ): Promise<Array<{ x: number, y: number }>> {
    console.log(`📐 Simplifying mesh from ${points.length} to ${targetCount} points using WebWorker...`);

    return this.executeTask('SIMPLIFY', { points, targetCount });
  }

  /**
   * Get performance metrics
   */
  public getMetrics() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.busyWorkers.size,
      queuedTasks: this.taskQueue.length,
      pendingTasks: this.pendingTasks.size,
      maxWorkers: this.maxWorkers
    };
  }

  /**
   * Check if workers are available
   */
  public isAvailable(): boolean {
    return this.availableWorkers.length > 0 || this.workers.length < this.maxWorkers;
  }

  /**
   * Clean up all workers
   */
  public cleanup(): void {
    console.log('🧹 Cleaning up WebWorker pool...');

    // Clear all pending tasks
    for (const task of this.pendingTasks.values()) {
      task.reject(new Error('WebWorker pool shutting down'));
    }
    this.pendingTasks.clear();

    // Clear task queue
    for (const task of this.taskQueue) {
      task.reject(new Error('WebWorker pool shutting down'));
    }
    this.taskQueue.length = 0;

    // Terminate all workers
    for (const worker of this.workers) {
      try {
        worker.terminate();
      } catch (error) {
        console.warn('⚠️ Error terminating worker during cleanup:', error);
      }
    }

    // Clear all pools
    this.workers.length = 0;
    this.availableWorkers.length = 0;
    this.busyWorkers.clear();

    console.log('✅ WebWorker pool cleaned up');
  }
}

// Export singleton instance
export const webWorkerManager = WebWorkerManager.getInstance();