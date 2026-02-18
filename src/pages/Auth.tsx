import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Sparkles, BarChart3, Cpu, History, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailSchema, passwordSchema } from "@/lib/validations";
import { showError } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: (score / 5) * 100, label: "Fraca", color: "bg-destructive" };
  if (score <= 3) return { score: (score / 5) * 100, label: "Média", color: "bg-amber-400" };
  return { score: (score / 5) * 100, label: "Forte", color: "bg-emerald-400" };
}

const FEATURES = [
  { icon: BarChart3, title: "Analytics de crescimento em tempo real", desc: "Monitore seguidores, follows e ações" },
  { icon: Cpu, title: "Monitoramento da extensão bridge", desc: "Sincronize dados automaticamente" },
  { icon: History, title: "Histórico completo de ações", desc: "Logs detalhados com filtros avançados" },
];

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tab, setTab] = useState("login");
  const navigate = useNavigate();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    try {
      logger.info("Login attempt", { email: values.email });
      const { error } = await supabase.auth.signInWithPassword({ 
        email: values.email, 
        password: values.password 
      });
      if (error) throw error;
      logger.info("Login successful", { email: values.email });
      navigate("/");
    } catch (error: unknown) {
      showError(error, "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (values: SignupValues) => {
    setLoading(true);
    try {
      logger.info("Signup attempt", { email: values.email });
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      logger.info("Signup successful", { email: values.email });
      toast.success("Conta criada! Verifique seu email para confirmar.");
    } catch (error: unknown) {
      showError(error, "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  const handleForgotPassword = async () => {
    const email = loginForm.getValues("email");
    if (!email) {
      toast.error("Digite seu email primeiro.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) toast.error(error.message);
    else toast.success("Email de recuperação enviado!");
  };

  const inputClasses = "pl-10 bg-secondary/40 border-border/60 focus:ring-1 focus:ring-primary/30";
  const watchedPassword = signupForm.watch("password");
  const strength = getPasswordStrength(watchedPassword || "");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 noise-overlay">
      {/* Background */}
      <div className="fixed inset-0 bg-background" />
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: "radial-gradient(hsl(252 62% 60% / 0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.03,
        }}
      />
      <div className="fixed top-[-40%] left-[-20%] h-[80vh] w-[80vh] rounded-full bg-primary/5 blur-[120px]" />
      <div className="fixed bottom-[-30%] right-[-10%] h-[60vh] w-[60vh] rounded-full bg-primary/8 blur-[100px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[920px] page-enter">
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/70 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="grid md:grid-cols-[1fr_1.1fr]">
            {/* Left: Branding */}
            <div className="flex flex-col justify-center gap-8 border-b border-border/30 p-8 md:border-b-0 md:border-r md:p-10">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  <span className="gradient-text">OrganicPublic</span>
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Monitore sua automação Instagram em tempo real
                </p>
              </div>

              <div className="space-y-4">
                {FEATURES.map((f, i) => (
                  <div key={i} className={`flex items-start gap-3 fade-up fade-up-${i + 1}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/10">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-[13px] font-medium text-foreground">{f.title}</span>
                      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div className="p-8 md:p-10">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/60">
                  <TabsTrigger value="login" className="text-[13px] font-semibold">Entrar</TabsTrigger>
                  <TabsTrigger value="signup" className="text-[13px] font-semibold">Criar Conta</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px]">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="seu@email.com" className={inputClasses} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px]">Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className={`${inputClasses} pr-10`}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px]">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="seu@email.com" className={inputClasses} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px]">Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className={`${inputClasses} pr-10`}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                            {/* Password strength indicator */}
                            {field.value && (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center gap-2">
                                  <Progress value={strength.score} className={`h-1.5 flex-1 [&>div]:${strength.color}`} />
                                  <span className={`text-[10px] font-medium ${
                                    strength.label === "Fraca" ? "text-destructive" : strength.label === "Média" ? "text-amber-400" : "text-emerald-400"
                                  }`}>{strength.label}</span>
                                </div>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px]">Confirmar Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type={showConfirm ? "text" : "password"}
                                  placeholder="••••••••"
                                  className={`${inputClasses} pr-10`}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirm(!showConfirm)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full gap-2" disabled={loading}>
                        {loading ? "Criando..." : "Criar Conta"}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* Divider + Google */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card/70 px-3 text-muted-foreground backdrop-blur">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 bg-secondary/30 border-border/50 hover:bg-secondary/50"
                  onClick={handleGoogle}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Entrar com Google
                </Button>
              </Tabs>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50 mt-4">
          OrganicPublic © {new Date().getFullYear()} · Growth Engine
        </p>
      </div>
    </div>
  );
};

export default Auth;
