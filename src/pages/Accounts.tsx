import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

const AccountsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contas Instagram</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Gerenciar Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma conta conectada ainda. Adicione sua primeira conta Instagram.</p>
          <Button className="mt-4">Adicionar Conta</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsPage;
