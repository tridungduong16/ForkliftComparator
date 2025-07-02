import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, TrendingUp, FileText, Calendar, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CompetitorQuote } from "@shared/schema";

export default function PricingIntelligence() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    competitorBrand: "",
    competitorModel: "",
    quotedPrice: "",
    quoteDate: new Date().toISOString().split('T')[0],
    supplierName: "",
    notes: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery<CompetitorQuote[]>({
    queryKey: ['/api/competitor-quotes']
  });

  const addQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/competitor-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          uploadedAt: new Date().toISOString(),
          status: "active"
        })
      });
      if (!response.ok) throw new Error('Failed to add quote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitor-quotes'] });
      setIsAddDialogOpen(false);
      setFormData({
        brand: "",
        model: "",
        competitorBrand: "",
        competitorModel: "",
        quotedPrice: "",
        quoteDate: new Date().toISOString().split('T')[0],
        supplierName: "",
        notes: ""
      });
      toast({
        title: "Success",
        description: "Competitor quote added successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add competitor quote",
        variant: "destructive"
      });
    }
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/competitor-quotes/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete quote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitor-quotes'] });
      toast({
        title: "Success",
        description: "Quote deleted successfully"
      });
    }
  });

  const filteredQuotes = quotes.filter(quote => {
    const brandMatch = !filterBrand || filterBrand === "all" || quote.brand.toLowerCase().includes(filterBrand.toLowerCase());
    const statusMatch = !filterStatus || filterStatus === "all" || quote.status === filterStatus;
    return brandMatch && statusMatch;
  });

  const uniqueBrands = Array.from(new Set(quotes.map(q => q.brand)));
  const statusOptions = ['active', 'expired', 'won', 'lost'];

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price.replace(/[^0-9.-]+/g, ""));
    return isNaN(numPrice) ? price : `$${numPrice.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'won': return 'bg-blue-100 text-blue-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.model || !formData.competitorBrand || !formData.competitorModel || !formData.quotedPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    addQuoteMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pricing Intelligence</h1>
          <p className="text-gray-600 mt-2">Track competitor quotes and market pricing trends</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Competitor Quote</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Our Brand *</Label>
                  <Select value={formData.brand} onValueChange={(value) => setFormData({...formData, brand: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Toyota">Toyota</SelectItem>
                      <SelectItem value="Hyster">Hyster</SelectItem>
                      <SelectItem value="Crown">Crown</SelectItem>
                      <SelectItem value="Linde">Linde</SelectItem>
                      <SelectItem value="Clark">Clark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="model">Our Model *</Label>
                  <Input
                    id="model"
                    placeholder="e.g., 8FG25"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="competitorBrand">Competitor Brand *</Label>
                  <Input
                    id="competitorBrand"
                    placeholder="e.g., Clark"
                    value={formData.competitorBrand}
                    onChange={(e) => setFormData({...formData, competitorBrand: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="competitorModel">Competitor Model *</Label>
                  <Input
                    id="competitorModel"
                    placeholder="e.g., C25"
                    value={formData.competitorModel}
                    onChange={(e) => setFormData({...formData, competitorModel: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quotedPrice">Quoted Price *</Label>
                  <Input
                    id="quotedPrice"
                    placeholder="$45,000"
                    value={formData.quotedPrice}
                    onChange={(e) => setFormData({...formData, quotedPrice: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="quoteDate">Quote Date</Label>
                  <Input
                    id="quoteDate"
                    type="date"
                    value={formData.quoteDate}
                    onChange={(e) => setFormData({...formData, quoteDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  placeholder="e.g., Clark Equipment Sales"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full" disabled={addQuoteMutation.isPending}>
                {addQuoteMutation.isPending ? "Adding..." : "Add Quote"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.filter(q => q.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quote Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(
                quotes.reduce((sum, q) => {
                  const price = parseFloat(q.quotedPrice.replace(/[^0-9.-]+/g, ""));
                  return sum + (isNaN(price) ? 0 : price);
                }, 0) / (quotes.length || 1)
              ).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.filter(q => {
                const quoteDate = new Date(q.quoteDate);
                const now = new Date();
                return quoteDate.getMonth() === now.getMonth() && 
                       quoteDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {uniqueBrands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
              <p className="text-gray-500">
                {quotes.length === 0 
                  ? "Add your first competitor quote to start tracking pricing intelligence"
                  : "Try adjusting your filters to see more results"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {quote.brand} {quote.model}
                      </h3>
                      <span className="text-sm text-gray-500">vs</span>
                      <h3 className="text-lg font-semibold text-blue-600">
                        {quote.competitorBrand} {quote.competitorModel}
                      </h3>
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <div className="font-semibold text-lg text-green-600">
                          {formatPrice(quote.quotedPrice)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Quote Date:</span>
                        <div className="font-medium">
                          {new Date(quote.quoteDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Supplier:</span>
                        <div className="font-medium">{quote.supplierName || 'Not specified'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Capacity:</span>
                        <div className="font-medium">{quote.capacity || 'TBA'}</div>
                      </div>
                    </div>

                    {quote.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{quote.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteQuoteMutation.mutate(quote.id)}
                      disabled={deleteQuoteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}