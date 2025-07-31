const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class GlobalRateLimitService {
  constructor() {
    this.openAICalls = [];
    this.maxCallsPerMinute = 5; // OpenAI's limit
    this.cleanupInterval = 60000; // Clean up old records every minute
    
    // Start cleanup timer
    setInterval(() => this.cleanupOldCalls(), this.cleanupInterval);
  }

  // Record an OpenAI API call
  recordOpenAICall(userId = 'system') {
    const now = Date.now();
    this.openAICalls.push({
      timestamp: now,
      userId: userId
    });

    console.log(`Global rate limit: Recorded OpenAI call for user ${userId}`);
    console.log(`Global rate limit: Total calls in last minute: ${this.getRecentCallCount()}`);
  }

  // Get count of calls in the last minute
  getRecentCallCount() {
    const oneMinuteAgo = Date.now() - 60000;
    return this.openAICalls.filter(call => call.timestamp > oneMinuteAgo).length;
  }

  // Check if we can make an OpenAI call
  canMakeOpenAICall() {
    const recentCalls = this.getRecentCallCount();
    const canCall = recentCalls < this.maxCallsPerMinute;
    
    console.log(`Global rate limit: ${recentCalls}/${this.maxCallsPerMinute} calls in last minute`);
    console.log(`Global rate limit: Can make call: ${canCall}`);
    
    return canCall;
  }

  // Wait until we can make an OpenAI call
  async waitForOpenAICall() {
    while (!this.canMakeOpenAICall()) {
      const waitTime = 5000; // Wait 5 seconds
      console.log(`⏸️ Global rate limit: Waiting ${waitTime}ms before next OpenAI call...`);
      await this.delay(waitTime);
    }
  }

  // Get time until next available slot
  getTimeUntilNextSlot() {
    const recentCalls = this.openAICalls.filter(call => call.timestamp > Date.now() - 60000);
    
    if (recentCalls.length >= this.maxCallsPerMinute) {
      // Find the oldest call in the last minute
      const oldestCall = Math.min(...recentCalls.map(call => call.timestamp));
      const timeUntilOldestExpires = 60000 - (Date.now() - oldestCall);
      return Math.max(0, timeUntilOldestExpires);
    }
    
    return 0; // Can call immediately
  }

  // Get queue position for a user
  getQueuePosition(userId) {
    const recentCalls = this.openAICalls.filter(call => call.timestamp > Date.now() - 60000);
    const userCalls = recentCalls.filter(call => call.userId === userId);
    return userCalls.length;
  }

  // Get global queue status
  getGlobalStatus() {
    const recentCalls = this.getRecentCallCount();
    const timeUntilNextSlot = this.getTimeUntilNextSlot();
    
    return {
      callsInLastMinute: recentCalls,
      maxCallsPerMinute: this.maxCallsPerMinute,
      canMakeCall: recentCalls < this.maxCallsPerMinute,
      timeUntilNextSlot: timeUntilNextSlot,
      estimatedWaitTime: timeUntilNextSlot > 0 ? Math.ceil(timeUntilNextSlot / 1000) : 0
    };
  }

  // Clean up old call records
  cleanupOldCalls() {
    const oneMinuteAgo = Date.now() - 60000;
    this.openAICalls = this.openAICalls.filter(call => call.timestamp > oneMinuteAgo);
    console.log(`🧹 Global rate limit: Cleaned up old records. Current calls: ${this.openAICalls.length}`);
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const globalRateLimitService = new GlobalRateLimitService();

module.exports = globalRateLimitService; 