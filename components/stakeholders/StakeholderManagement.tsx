'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Upload, Users, UserCheck, UserX, Search, Edit, Trash2, Mail, FileText, Download, Eye } from 'lucide-react';

interface StakeholderManagementProps {
  eventId: string;
  stakeholders: any[];
  stats: any;
  filters: {
    role?: string;
    attendanceStatus?: string;
    search?: string;
  };
}

export default function StakeholderManagement({
  eventId,
  stakeholders,
  stats,
  filters,
}: StakeholderManagementProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedRole, setSelectedRole] = useState(filters.role || 'all');
  const [selectedStatus, setSelectedStatus] = useState(filters.attendanceStatus || 'all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<any>(null);
  const [selectedStakeholders, setSelectedStakeholders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: '',
    email: '',
    role: 'attendee',
    attendanceStatus: 'registered',
    additionalInfo: {
      company: '',
      title: '',
      phone: '',
      notes: ''
    }
  });

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'attendee', label: 'Attendee' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'organizer', label: 'Organizer' },
    { value: 'sponsor', label: 'Sponsor' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'registered', label: 'Registered' },
    { value: 'attended', label: 'Attended' },
    { value: 'no-show', label: 'No Show' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'speaker': return 'bg-purple-100 text-purple-800';
      case 'volunteer': return 'bg-green-100 text-green-800';
      case 'organizer': return 'bg-blue-100 text-blue-800';
      case 'sponsor': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'attended': return 'bg-green-100 text-green-800';
      case 'registered': return 'bg-blue-100 text-blue-800';
      case 'no-show': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddStakeholder = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stakeholders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'single',
          eventId,
          ...newStakeholder
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create stakeholder');
      }

      toast({
        title: 'Success',
        description: 'Stakeholder added successfully',
      });

      setIsAddDialogOpen(false);
      setNewStakeholder({
        name: '',
        email: '',
        role: 'attendee',
        attendanceStatus: 'registered',
        additionalInfo: {
          company: '',
          title: '',
          phone: '',
          notes: ''
        }
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add stakeholder',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAttendance = async (stakeholderId: string, status: string) => {
    try {
      const response = await fetch(`/api/stakeholders/${stakeholderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceStatus: status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }

      toast({
        title: 'Success',
        description: 'Attendance status updated',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update attendance',
        variant: 'destructive',
      });
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedStakeholders.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select stakeholders to update',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/stakeholders/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stakeholderIds: selectedStakeholders,
          attendanceStatus: status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update');
      }

      toast({
        title: 'Success',
        description: `Updated ${selectedStakeholders.length} stakeholders`,
      });

      setSelectedStakeholders([]);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to bulk update',
        variant: 'destructive',
      });
    }
  };

  const handleCreateDemoData = async () => {
    try {
      const response = await fetch('/api/stakeholders/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create demo data');
      }

      toast({
        title: 'Success',
        description: 'Demo stakeholders created successfully',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create demo data',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedRole !== 'all') params.set('role', selectedRole);
    if (selectedStatus !== 'all') params.set('attendanceStatus', selectedStatus);
    
    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '';
    router.push(`/event/${eventId}/stakeholders${newUrl}`);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedStatus('all');
    router.push(`/event/${eventId}/stakeholders`);
  };

  const filteredStakeholders = stakeholders.filter(stakeholder => {
    const matchesRole = selectedRole === 'all' || stakeholder.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || stakeholder.attendanceStatus === selectedStatus;
    const matchesSearch = !searchTerm || 
      stakeholder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.additionalInfo?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStakeholders(filteredStakeholders.map(s => s._id));
    } else {
      setSelectedStakeholders([]);
    }
  };

  const handleSelectStakeholder = (stakeholderId: string, checked: boolean) => {
    if (checked) {
      setSelectedStakeholders(prev => [...prev, stakeholderId]);
    } else {
      setSelectedStakeholders(prev => prev.filter(id => id !== stakeholderId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total stakeholders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attended</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stakeholders.filter(s => s.attendanceStatus === 'attended').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Confirmed attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Show</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stakeholders.filter(s => s.attendanceStatus === 'no-show').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Did not attend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificatesGenerated || 0}</div>
            <p className="text-xs text-muted-foreground">
              Certificates generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Stakeholder List</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stakeholders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={selectedRole} onValueChange={(value) => {
                setSelectedRole(value);
                handleSearch();
              }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                handleSearch();
              }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all') && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Reset
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {selectedStakeholders.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdate('attended')}
                  >
                    Mark Attended
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkUpdate('no-show')}
                  >
                    Mark No-Show
                  </Button>
                </div>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stakeholder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Add New Stakeholder</DialogTitle>
                    <DialogDescription>
                      Add a new stakeholder to this event.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        value={newStakeholder.name}
                        onChange={(e) => setNewStakeholder(prev => ({ ...prev, name: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStakeholder.email}
                        onChange={(e) => setNewStakeholder(prev => ({ ...prev, email: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role *
                      </Label>
                      <Select value={newStakeholder.role} onValueChange={(value) => setNewStakeholder(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attendee">Attendee</SelectItem>
                          <SelectItem value="speaker">Speaker</SelectItem>
                          <SelectItem value="volunteer">Volunteer</SelectItem>
                          <SelectItem value="organizer">Organizer</SelectItem>
                          <SelectItem value="sponsor">Sponsor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company" className="text-right">
                        Company
                      </Label>
                      <Input
                        id="company"
                        value={newStakeholder.additionalInfo.company}
                        onChange={(e) => setNewStakeholder(prev => ({ 
                          ...prev, 
                          additionalInfo: { ...prev.additionalInfo, company: e.target.value }
                        }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={newStakeholder.additionalInfo.title}
                        onChange={(e) => setNewStakeholder(prev => ({ 
                          ...prev, 
                          additionalInfo: { ...prev.additionalInfo, title: e.target.value }
                        }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={newStakeholder.additionalInfo.phone}
                        onChange={(e) => setNewStakeholder(prev => ({ 
                          ...prev, 
                          additionalInfo: { ...prev.additionalInfo, phone: e.target.value }
                        }))}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddStakeholder} disabled={isLoading}>
                      {isLoading ? 'Adding...' : 'Add Stakeholder'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stakeholder List */}
          <div className="space-y-4">
            {filteredStakeholders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Stakeholders Found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {stakeholders.length === 0 
                      ? "Add stakeholders manually or import them from a CSV file."
                      : "No stakeholders match your current filters."
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stakeholder
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('import')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                    {stakeholders.length === 0 && (
                      <Button variant="secondary" onClick={handleCreateDemoData}>
                        <Users className="h-4 w-4 mr-2" />
                        Create Demo Data
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedStakeholders.length === filteredStakeholders.length && filteredStakeholders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        {selectedStakeholders.length > 0 
                          ? `${selectedStakeholders.length} selected` 
                          : `${filteredStakeholders.length} stakeholders`
                        }
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name & Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Certificate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStakeholders.map((stakeholder) => (
                        <TableRow key={stakeholder._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStakeholders.includes(stakeholder._id)}
                              onCheckedChange={(checked) => handleSelectStakeholder(stakeholder._id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {stakeholder.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{stakeholder.name}</div>
                                <div className="text-sm text-muted-foreground">{stakeholder.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(stakeholder.role)}>
                              {stakeholder.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={stakeholder.attendanceStatus} 
                              onValueChange={(value) => handleUpdateAttendance(stakeholder._id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="registered">Registered</SelectItem>
                                <SelectItem value="attended">Attended</SelectItem>
                                <SelectItem value="no-show">No Show</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {stakeholder.additionalInfo?.company || '-'}
                          </TableCell>
                          <TableCell>
                            {stakeholder.certificateGenerated ? (
                              <Badge variant="outline" className="text-green-600">
                                <FileText className="h-3 w-3 mr-1" />
                                Generated
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Stakeholders</CardTitle>
                <CardDescription>
                  Upload a CSV or Excel file to import multiple stakeholders at once.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-lg font-medium mb-2">Upload CSV or Excel File</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Required columns:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>name (required)</li>
                    <li>email (required)</li>
                    <li>role (required: attendee, speaker, volunteer, organizer, sponsor)</li>
                    <li>company (optional)</li>
                    <li>title (optional)</li>
                    <li>phone (optional)</li>
                  </ul>
                </div>

                <Button className="w-full" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Imports</CardTitle>
                <CardDescription>
                  View the status of your recent stakeholder imports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  No recent imports found.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>
                  Breakdown of stakeholders by their roles in the event.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['attendee', 'speaker', 'volunteer', 'organizer', 'sponsor'].map(role => {
                    const count = stakeholders.filter(s => s.role === role).length;
                    const percentage = stakeholders.length > 0 ? (count / stakeholders.length) * 100 : 0;
                    return (
                      <div key={role} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getRoleBadgeColor(role)}>
                            {role}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{count} stakeholders</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Status */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Status</CardTitle>
                <CardDescription>
                  Track attendance status across all stakeholders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['registered', 'attended', 'no-show', 'cancelled'].map(status => {
                    const count = stakeholders.filter(s => s.attendanceStatus === status).length;
                    const percentage = stakeholders.length > 0 ? (count / stakeholders.length) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusBadgeColor(status)}>
                            {status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{count} stakeholders</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Certificate Generation */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Generation</CardTitle>
                <CardDescription>
                  Track certificate generation progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-2xl font-bold">
                      {stakeholders.filter(s => s.certificateGenerated).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Certificates Generated</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">
                      {stakeholders.length > 0 
                        ? ((stakeholders.filter(s => s.certificateGenerated).length / stakeholders.length) * 100).toFixed(1)
                        : 0
                      }%
                    </div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Communications */}
            <Card>
              <CardHeader>
                <CardTitle>Email Communications</CardTitle>
                <CardDescription>
                  Overview of email communications sent to stakeholders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stakeholders.filter(s => s.emailsSent?.welcome).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Welcome Emails</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stakeholders.filter(s => s.emailsSent?.reminder).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Reminder Emails</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stakeholders.filter(s => s.emailsSent?.thankYou).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Thank You Emails</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stakeholders.filter(s => s.emailsSent?.certificate).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Certificate Emails</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
