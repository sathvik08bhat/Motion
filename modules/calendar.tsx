import { Module, registerModule } from '../core/modules/registry';
import React from 'react';

// Example UI Component
const CalendarWidget = () => {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
      <h3 className="text-sm font-medium text-white/60 mb-2">Upcoming Events</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-sm text-white/90">Design Sync</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-sm text-white/90">Product Review</span>
        </div>
      </div>
    </div>
  );
};

export const CalendarModule: Module = {
  name: 'Calendar',
  init: () => {
    console.log('Calendar Module Initialized');
    // Here you would setup listeners, fetch initial data, etc.
  },
  actions: [
    {
      id: 'calendar.add_event',
      label: 'Add Event',
      handler: () => {
        console.log('Adding new event...');
      },
      icon: 'CalendarIcon'
    },
    {
      id: 'calendar.sync',
      label: 'Sync Calendar',
      handler: () => {
        console.log('Syncing calendar...');
      }
    }
  ],
  components: {
    Widget: CalendarWidget
  },
  onEvent: {
    'task_completed': (data) => {
      console.log(`📅 Calendar Module: Noted completion of "${data.title}". Syncing...`);
    }
  },
  onTick: (store) => {
    // console.log('📅 Calendar Module: Agent tick received. Checking for schedule drifts...');
  }
};




