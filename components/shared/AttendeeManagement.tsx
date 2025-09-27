'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Download,
  Users,
  Calendar,
  Mail,
  Ticket,
  DollarSign,
  Loader2
} from 'lucide-react';
import { IAttendee } from '@/types';
import { getEventAttendees } from '@/lib/actions/order.action';
import { toast } from 'sonner';

interface AttendeeManagementProps {
  eventId: string;
  organizerId: string;
  eventTitle: string;
}

export default function AttendeeManagement({
  eventId,
  organizerId,
  eventTitle
}: AttendeeManagementProps) {
  const [attendees, setAttendees] = useState<IAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAttendees = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const result = await getEventAttendees({
        eventId,
        organizerId,
        searchString: search,
        page,
        limit: 20
      });

      setAttendees(result.data);
      setTotalAttendees(result.totalAttendees);
      setTotalPages(result.totalPages);
      setCurrentPage(page);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch attendees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, [eventId, organizerId]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchAttendees(1, value);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await fetch('/api/attendees/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to export attendees');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${eventTitle}_attendees.xlsx`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Attendees exported successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export attendees');
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = attendees.reduce((sum, attendee) => sum + attendee.totalAmount, 0);
  const totalTickets = attendees.reduce((sum, attendee) => sum + attendee.totalTickets, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Attendees</h1>
          <p className="text-gray-600 mt-1">{eventTitle}</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || attendees.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export to Excel
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue === 0 ? 'Free Event' : `₹${totalRevenue.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search attendees by name or email..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Attendees List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Attendees ({totalAttendees})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading attendees...</span>
            </div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No attendees found matching your search.' : 'No attendees registered yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {attendees.map((attendee) => (
                <div key={attendee._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={attendee.photo} />
                      <AvatarFallback>
                        {attendee.firstName?.[0] || 'U'}{attendee.lastName?.[0] || 'N'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {attendee.firstName} {attendee.lastName}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Mail className="w-3 h-3 mr-1" />
                        {attendee.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        Registered: {new Date(attendee.registrationDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {attendee.totalTickets} ticket{attendee.totalTickets !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant={attendee.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                        {attendee.totalAmount === 0 ? 'Free' : `₹${attendee.totalAmount}`}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {attendee.paymentStatus === 'completed' ? 'Confirmed' : 'Pending'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchAttendees(currentPage - 1, searchTerm)}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => fetchAttendees(currentPage + 1, searchTerm)}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
