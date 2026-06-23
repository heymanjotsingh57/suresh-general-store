import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  Boxes,
  Plus,
  Pencil,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  History as HistoryIcon,
  Store,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  actions,
  isLowStock,
  UNITS,
  useInventory,
  type Item,
  type Unit,
} from "@/lib/inventory-store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Suresh General Store — Inventory" },
      {
        name: "description",
        content:
          "Manage stock, sales, restocks, and low-stock alerts for Suresh General Store.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { items, history } = useInventory();
  const { displayName, role, user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const isOwner = role === "owner";

  useEffect(() => {
    if (displayName) actions.setUser(displayName);
  }, [displayName]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  const totalItems = items.length;
  const lowStockItems = items.filter(isLowStock);
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight sm:text-lg">
                Suresh General Store
              </h1>
              <p className="text-xs text-muted-foreground">Inventory Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">
                {displayName ?? user?.email ?? "User"}
              </p>
              <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                {isOwner ? "Owner" : "Staff"}
              </p>
            </div>
            <Badge variant={isOwner ? "default" : "secondary"} className="sm:hidden">
              {isOwner ? "Owner" : "Staff"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-1.5">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">Items</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <HistoryIcon className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Total Items"
                value={totalItems}
                icon={<Package className="h-5 w-5" />}
              />
              <StatCard
                label="Total Units in Stock"
                value={totalUnits}
                icon={<Boxes className="h-5 w-5" />}
              />
              <StatCard
                label="Low Stock Alerts"
                value={lowStockItems.length}
                icon={<AlertTriangle className="h-5 w-5" />}
                tone={lowStockItems.length > 0 ? "alert" : "default"}
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  Low Stock Items
                </CardTitle>
                <Badge variant="secondary">{lowStockItems.length}</Badge>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    All items are well stocked. ✓
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Alert at {item.lowStockAlert} {item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Stock</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No items yet. Add one from the Items tab.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span
                          className={
                            isLowStock(item)
                              ? "font-semibold text-primary"
                              : "text-foreground"
                          }
                        >
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="mt-5 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items..."
                  className="pl-9"
                />
              </div>
              <ItemDialog
                trigger={
                  <Button className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                }
              />
            </div>

            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {items.length === 0
                    ? "No items yet. Tap 'Add Item' to start."
                    : "No items match your search."}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filtered.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Stock History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No activity yet.
                  </p>
                ) : (
                  <div className="divide-y">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-start justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{h.itemName}</span>
                            <ActionBadge action={h.action} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(h.timestamp).toLocaleString()} · by {h.user}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              h.quantityChange > 0
                                ? "text-emerald-600"
                                : h.quantityChange < 0
                                  ? "text-primary"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {h.quantityChange > 0 ? "+" : ""}
                            {h.quantityChange}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            now {h.resultingQuantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "alert";
}) {
  return (
    <Card
      className={
        tone === "alert" && value > 0
          ? "border-primary/40 bg-primary/5"
          : ""
      }
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            tone === "alert" && value > 0
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemCard({ item }: { item: Item }) {
  const low = isLowStock(item);
  return (
    <Card className={low ? "border-primary/40" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{item.name}</h3>
            <p className="text-xs text-muted-foreground">
              Alert at {item.lowStockAlert} {item.unit}
            </p>
          </div>
          {low && (
            <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <AlertTriangle className="h-3 w-3" />
              Low
            </Badge>
          )}
        </div>
        <div className="my-3 flex items-baseline gap-1.5">
          <span
            className={`text-3xl font-bold ${low ? "text-primary" : "text-foreground"}`}
          >
            {item.quantity}
          </span>
          <span className="text-sm text-muted-foreground">{item.unit}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StockDialog item={item} mode="restock" />
          <StockDialog item={item} mode="sell" />
        </div>
        <div className="mt-2 flex gap-2">
          <ItemDialog
            item={item}
            trigger={
              <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(`Delete "${item.name}"?`)) {
                actions.deleteItem(item.id);
                toast.success(`Deleted ${item.name}`);
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemDialog({
  item,
  trigger,
}: {
  item?: Item;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState<string>(String(item?.quantity ?? 0));
  const [unit, setUnit] = useState<Unit>(item?.unit ?? "kg");
  const [alert, setAlert] = useState<string>(String(item?.lowStockAlert ?? 5));

  function reset() {
    setName(item?.name ?? "");
    setQuantity(String(item?.quantity ?? 0));
    setUnit(item?.unit ?? "kg");
    setAlert(String(item?.lowStockAlert ?? 5));
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Item name is required");
    const q = Number(quantity);
    const a = Number(alert);
    if (!Number.isFinite(q) || q < 0) return toast.error("Quantity must be 0 or more");
    if (!Number.isFinite(a) || a < 0) return toast.error("Alert must be 0 or more");
    if (item) {
      actions.updateItem(item.id, { name: trimmed, quantity: q, unit, lowStockAlert: a });
      toast.success(`Updated ${trimmed}`);
    } else {
      actions.addItem({ name: trimmed, quantity: q, unit, lowStockAlert: a });
      toast.success(`Added ${trimmed}`);
    }
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the item details." : "Add a new product to your inventory."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basmati Rice"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty">Current Quantity</Label>
              <Input
                id="qty"
                type="number"
                inputMode="decimal"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="alert">Low Stock Alert Quantity</Label>
            <Input
              id="alert"
              type="number"
              inputMode="decimal"
              min={0}
              value={alert}
              onChange={(e) => setAlert(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You'll see a warning when stock falls to or below this amount.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{item ? "Save" : "Add Item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StockDialog({ item, mode }: { item: Item; mode: "restock" | "sell" }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("1");
  const isRestock = mode === "restock";

  function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      return toast.error("Enter a quantity greater than zero");
    }
    const result = isRestock ? actions.restock(item.id, n) : actions.sell(item.id, n);
    if (!result.ok) {
      toast.error(result.message ?? "Action failed");
      return;
    }
    toast.success(
      isRestock
        ? `Added ${n} ${item.unit} to ${item.name}`
        : `Sold ${n} ${item.unit} of ${item.name}`,
    );
    setOpen(false);
    setAmount("1");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setAmount("1");
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={isRestock ? "default" : "secondary"}
          className="gap-1.5"
        >
          {isRestock ? (
            <>
              <TrendingUp className="h-3.5 w-3.5" />
              Restock
            </>
          ) : (
            <>
              <TrendingDown className="h-3.5 w-3.5" />
              Sell
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isRestock ? "Add Stock" : "Record Sale"} — {item.name}
          </DialogTitle>
          <DialogDescription>
            Current stock: {item.quantity} {item.unit}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Quantity ({item.unit})</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min={0}
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
          {!isRestock && Number(amount) > item.quantity && (
            <p className="flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3 w-3" />
              Only {item.quantity} {item.unit} available.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{isRestock ? "Add Stock" : "Record Sale"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    create: { label: "Created", cls: "bg-blue-100 text-blue-700" },
    edit: { label: "Edited", cls: "bg-amber-100 text-amber-800" },
    delete: { label: "Deleted", cls: "bg-red-100 text-red-700" },
    restock: { label: "Restock", cls: "bg-emerald-100 text-emerald-700" },
    sale: { label: "Sale", cls: "bg-primary/15 text-primary" },
    add: { label: "Added", cls: "bg-emerald-100 text-emerald-700" },
  };
  const m = map[action] ?? { label: action, cls: "bg-muted text-foreground" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}
