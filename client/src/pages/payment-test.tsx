import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, CreditCard, Loader2, User, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTokenAuth } from "@/hooks/use-token-auth";

interface PaymentTransaction {
  id: string;
  orderReference: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  gatewayProvider: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentTestPage() {
  const { toast } = useToast();
  const { isAuthenticated, user, loginMutation } = useTokenAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentTransaction | null>(null);
  
  // Login form for quick auth
  const [loginEmail, setLoginEmail] = useState("test@example.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  
  // Form data
  const [amount, setAmount] = useState("100.00");
  const [currency, setCurrency] = useState("AED");
  const [description, setDescription] = useState("Second Chance Premium Subscription Test");
  const [planType, setPlanType] = useState("premium");

  const handleQuickLogin = async () => {
    loginMutation.mutate({
      email: loginEmail,
      password: loginPassword,
    });
  };

  const createPayment = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in first to test payments",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/v1/payments/create", {
        amount: parseFloat(amount),
        currency,
        description,
        planType,
        gatewayProvider: "telr"
      });

      const result = await response.json();
      
      if (result.success) {
        setPaymentUrl(result.paymentUrl);
        setOrderReference(result.orderReference);
        
        toast({
          title: "Payment Created Successfully",
          description: `Order reference: ${result.orderReference}`,
        });
      } else {
        throw new Error(result.error || "Payment creation failed");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      toast({
        title: "Payment Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderReference) {
      toast({
        title: "Error",
        description: "No order reference available",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      const response = await apiRequest("GET", `/api/v1/payments/status/${orderReference}`);
      const result = await response.json();
      
      if (result.success) {
        setPaymentStatus(result.transaction);
        
        toast({
          title: "Status Updated",
          description: `Payment status: ${result.status}`,
        });
      } else {
        throw new Error(result.error || "Status check failed");
      }
    } catch (error) {
      console.error("Status check error:", error);
      toast({
        title: "Status Check Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
      default:
        return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'pending':
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Payment Gateway Test</h1>
          <p className="text-gray-600 mt-2">
            Authentication required to test the payment system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Quick Login for Testing
            </CardTitle>
            <CardDescription>
              Log in to access the payment testing interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <Button
              onClick={handleQuickLogin}
              disabled={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Login to Test Payments
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Don't have an account? <a href="/auth-token-page" className="text-blue-600 hover:underline">Register here</a></p>
              <p className="mt-2">Or use the login page: <a href="/login" className="text-blue-600 hover:underline">/login</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Gateway Test</h1>
        <p className="text-gray-600 mt-2">
          Test the generic payment system with Telr gateway integration
        </p>
        {user && (
          <p className="text-sm text-green-600 mt-1">
            ✅ Logged in as: {user.fullName} ({user.email})
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Create Payment
            </CardTitle>
            <CardDescription>
              Create a new payment order using Telr gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="planType">Plan Type</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment description"
                rows={2}
              />
            </div>

            <Button
              onClick={createPayment}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                "Create Payment"
              )}
            </Button>

            {paymentUrl && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Payment Created!</h4>
                <p className="text-sm text-green-700 mb-2">
                  Order Reference: <code className="bg-green-100 px-1 rounded">{orderReference}</code>
                </p>
                <Button
                  onClick={() => window.open(paymentUrl, '_blank')}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Open Payment Page
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>
              Check the current status of your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderReference && (
              <div className="p-3 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-600">Order Reference:</p>
                <code className="text-sm font-mono">{orderReference}</code>
              </div>
            )}

            <Button
              onClick={checkPaymentStatus}
              disabled={isChecking || !orderReference}
              variant="outline"
              className="w-full"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Status...
                </>
              ) : (
                "Check Payment Status"
              )}
            </Button>

            {paymentStatus && (
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border ${getStatusColor(paymentStatus.status)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(paymentStatus.status)}
                    <span className="font-semibold capitalize">
                      {paymentStatus.status}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Amount:</strong> {paymentStatus.amount} {paymentStatus.currency}</p>
                    <p><strong>Description:</strong> {paymentStatus.description}</p>
                    <p><strong>Gateway:</strong> {paymentStatus.gatewayProvider}</p>
                    <p><strong>Created:</strong> {new Date(paymentStatus.createdAt).toLocaleString()}</p>
                    {paymentStatus.updatedAt !== paymentStatus.createdAt && (
                      <p><strong>Updated:</strong> {new Date(paymentStatus.updatedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!orderReference && (
              <div className="text-center text-gray-500 py-8">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Create a payment first to check its status</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Testing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>How to test the payment system:</h4>
            <ol>
              <li>Fill in the payment details and click "Create Payment"</li>
              <li>A payment URL will be generated - click "Open Payment Page"</li>
              <li>Complete or cancel the payment on Telr's page</li>
              <li>Return here and click "Check Payment Status" to see the result</li>
            </ol>
            
            <h4>Supported Gateways:</h4>
            <ul>
              <li><strong>Telr:</strong> Currently implemented and configured</li>
              <li><strong>Future:</strong> Stripe, PayPal, and other gateways can be added using the same generic interface</li>
            </ul>

            <h4>API Endpoints:</h4>
            <ul>
              <li><code>POST /api/v1/payments/create</code> - Create payment order</li>
              <li><code>GET /api/v1/payments/status/:orderRef</code> - Check payment status</li>
              <li><code>GET /api/v1/payments/history</code> - Get payment history</li>
              <li><code>POST /api/v1/webhooks/telr</code> - Telr webhook handler</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}