import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>Your Bam Burgers branch details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Restaurant Name</p>
              <p className="font-medium">Bam Burgers</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Branch</p>
              <p className="font-medium">Kitchen Park Salwa</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">834C+HH Rumaithiya, Kuwait</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">+965 9474 5424</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Backend connections and services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>Supabase Database</span>
            <Badge className="bg-green-500">Connected</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>Realtime Subscriptions</span>
            <Badge className="bg-green-500">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>Authentication</span>
            <Badge className="bg-green-500">Enabled</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Supabase connection details (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Project URL</p>
            <code className="text-xs bg-gray-100 p-2 rounded block mt-1 break-all">
              https://sqhjsctsxlnivcbeclrn.supabase.co
            </code>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tenant ID</p>
            <code className="text-xs bg-gray-100 p-2 rounded block mt-1 break-all">
              d82147fa-f5e3-474c-bb39-6936ad3b519a
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
