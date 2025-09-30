'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Users, Send, Download, Award, Zap, Sparkles } from 'lucide-react';

interface CertificateManagementProps {
  eventId: string;
  templates: any[];
  stakeholders: any[];
}

export default function CertificateManagement({
  eventId,
  templates,
  stakeholders,
}: CertificateManagementProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    try {
      // Call auto-generate API
      const response = await fetch(`/api/certificates/auto-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (response.ok) {
        const results = await response.json();
        alert(`Successfully generated ${results.filter((r: any) => r.success).length} certificates!`);
        // Refresh the page or update state
        window.location.reload();
      } else {
        alert('Failed to auto-generate certificates');
      }
    } catch (error) {
      console.error('Error auto-generating certificates:', error);
      alert('Error auto-generating certificates');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const certificateStats = {
    totalTemplates: templates.length,
    totalStakeholders: stakeholders.length,
    certificatesGenerated: stakeholders.filter(s => s.certificateGenerated).length,
    emailsSent: stakeholders.filter(s => s.emailsSent?.certificate).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificateStats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Certificate templates created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stakeholders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificateStats.totalStakeholders}</div>
            <p className="text-xs text-muted-foreground">
              Total participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificateStats.certificatesGenerated}</div>
            <p className="text-xs text-muted-foreground">
              Certificates generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificateStats.emailsSent}</div>
            <p className="text-xs text-muted-foreground">
              Certificate emails sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="distribute">Distribute</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Certificate Templates</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAutoGenerate}
                disabled={isAutoGenerating}
              >
                {isAutoGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-Generate Certificates
                  </>
                )}
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Default certificate templates will be created automatically when you first access this page.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Load Default Templates
                  </Button>
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card
                  key={template._id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${template.templateType === 'generated'
                      ? 'border-blue-200 bg-blue-50/50'
                      : ''
                    }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.templateType === 'generated' && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">
                          {template.templateType === 'generated' ? 'Auto-Generated' : template.templateType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fields:</span>
                        <span className="font-medium">{template.fields?.length || 0}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {template.templateType === 'generated' ? (
                          <Button size="sm" variant="outline" className="flex-1">
                            <Award className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="flex-1">
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              Preview
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Generate Certificates</h3>
            <Button disabled={templates.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Bulk Generate
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You need to create a certificate template before generating certificates.
                </p>
                <Button onClick={() => setActiveTab('templates')}>
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Generation</CardTitle>
                  <CardDescription>
                    Select a template and stakeholders to generate certificates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Certificate generation interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="distribute" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Distribute Certificates</h3>
            <Button disabled={certificateStats.certificatesGenerated === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send Emails
            </Button>
          </div>

          {certificateStats.certificatesGenerated === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Send className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Certificates to Distribute</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate certificates first before you can distribute them.
                </p>
                <Button onClick={() => setActiveTab('generate')}>
                  Generate Certificates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Distribution</CardTitle>
                  <CardDescription>
                    Send certificates to stakeholders via email.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Email distribution interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
