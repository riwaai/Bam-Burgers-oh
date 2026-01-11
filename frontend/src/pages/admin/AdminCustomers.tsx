import React, { useState, useEffect } from 'react';
import { Users, Search, Gift, Phone, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  loyalty_points: number;
  wallet_balance: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedCustomer || adjustPoints === 0) {
      toast.error('Please enter a valid points amount');
      return;
    }

    try {
      const newPoints = Math.max(0, (selectedCustomer.loyalty_points || 0) + adjustPoints);
      
      // Update customer points
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          loyalty_points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCustomer.id);

      if (updateError) throw updateError;

      // Create loyalty transaction record
      const { error: transError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: selectedCustomer.id,
          points_earned: adjustPoints > 0 ? adjustPoints : 0,
          points_spent: adjustPoints < 0 ? Math.abs(adjustPoints) : 0,
          balance_after: newPoints,
          notes: adjustReason || (adjustPoints > 0 ? 'Manual adjustment (added)' : 'Manual adjustment (deducted)'),
        });

      if (transError) console.warn('Could not log transaction:', transError);

      toast.success(`Points ${adjustPoints > 0 ? 'added' : 'deducted'} successfully`);
      setShowDialog(false);
      setAdjustPoints(0);
      setAdjustReason('');
      fetchCustomers();
    } catch (err) {
      console.error('Error adjusting points:', err);
      toast.error('Failed to adjust points');
    }
  };

  const openCustomerDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setAdjustPoints(0);
    setAdjustReason('');
    setShowDialog(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage customer accounts and loyalty points</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points Issued</p>
                <p className="text-2xl font-bold">
                  {customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-center p-4 font-medium">Loyalty Points</th>
                  <th className="text-center p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Joined</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{customer.name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">ID: {customer.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                        <Gift className="h-4 w-4 text-primary" />
                        <span className="font-bold text-primary">{customer.loyalty_points || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(customer.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => openCustomerDialog(customer)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No customers match your search' : 'No customers yet'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Customer</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-semibold text-lg">{selectedCustomer.name || 'Guest'}</p>
                {selectedCustomer.phone && <p className="text-sm">{selectedCustomer.phone}</p>}
                {selectedCustomer.email && <p className="text-sm">{selectedCustomer.email}</p>}
              </div>

              {/* Current Points */}
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Loyalty Points</p>
                <p className="text-4xl font-bold text-primary">{selectedCustomer.loyalty_points || 0}</p>
              </div>

              {/* Adjust Points */}
              <div className="space-y-2">
                <Label>Adjust Points (+/-)</Label>
                <Input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(parseInt(e.target.value) || 0)}
                  placeholder="Enter positive to add, negative to deduct"
                />
                <p className="text-xs text-muted-foreground">
                  New balance: {Math.max(0, (selectedCustomer.loyalty_points || 0) + adjustPoints)} points
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g., Birthday bonus, Correction"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleAdjustPoints} disabled={adjustPoints === 0}>
              {adjustPoints > 0 ? 'Add Points' : adjustPoints < 0 ? 'Deduct Points' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
