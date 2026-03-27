import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCalculateVertex } from '@workspace/api-client-react';
import { Input, Label, Button } from '@/components/ui-elements';
import { CityAutocomplete } from '@/components/city-autocomplete';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  date: z.string().min(1, "Birth date is required"),
  time: z.string().min(1, "Birth time is required"),
  cityDisplay: z.string().min(1, "City is required"),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

type FormValues = z.infer<typeof formSchema>;

export default function CalculatorPage() {
  const [calculationResult, setCalculationResult] = useState<any | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      date: '',
      time: '',
      cityDisplay: '',
      lat: 0,
      lon: 0,
    },
  });

  const { mutate: calculateVertex, isPending, error: apiError } = useCalculateVertex({
    mutation: {
      onSuccess: (data) => {
        setCalculationResult(data);
        setIsCalculated(true);
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    calculateVertex({
      data: {
        name: data.name,
        date: data.date,
        time: data.time,
        lat: data.lat,
        lon: data.lon,
      }
    });
  };

  const handleReset = () => {
    setIsCalculated(false);
    setTimeout(() => {
      setCalculationResult(null);
      reset();
    }, 400); 
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-background">
      {/* Mystical Background Image - declared in requirements.yaml */}
      <div 
        className="absolute inset-0 z-0 opacity-30 mix-blend-screen pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/mystic-bg.png)` }}
      />

      <div className="w-full max-w-lg z-10 relative">
        <motion.div 
          className="glass-panel rounded-[2rem] p-6 sm:p-10 relative overflow-visible"
          layout
          transition={{ duration: 0.5, type: "spring", bounce: 0.15 }}
        >
          {apiError && !isCalculated && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Calculation Failed</p>
                <p className="opacity-90">{apiError.message || "An unexpected error occurred. Please try again."}</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!isCalculated ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <Label htmlFor="name">Your Name</Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="name"
                        placeholder="Enter your name"
                        className={errors.name ? "border-destructive/50 focus:border-destructive focus:ring-destructive" : ""}
                      />
                    )}
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1 ml-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label htmlFor="date">Birth Date</Label>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="date"
                          type="date"
                          className={`[color-scheme:dark] ${errors.date ? "border-destructive/50 focus:border-destructive" : ""}`}
                        />
                      )}
                    />
                    {errors.date && <p className="text-xs text-destructive mt-1 ml-1">{errors.date.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="time">Birth Time</Label>
                    <Controller
                      name="time"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="time"
                          type="time"
                          className={`[color-scheme:dark] ${errors.time ? "border-destructive/50 focus:border-destructive" : ""}`}
                        />
                      )}
                    />
                    {errors.time && <p className="text-xs text-destructive mt-1 ml-1">{errors.time.message}</p>}
                  </div>
                </div>

                <div className="space-y-1 relative z-50">
                  <Label>Birth City</Label>
                  <Controller
                    name="cityDisplay"
                    control={control}
                    render={({ field }) => (
                      <CityAutocomplete
                        value={field.value}
                        error={errors.cityDisplay?.message}
                        disabled={isPending}
                        onChange={(name, lat, lon) => {
                          field.onChange(name);
                          setValue('lat', lat, { shouldValidate: true });
                          setValue('lon', lon, { shouldValidate: true });
                        }}
                      />
                    )}
                  />
                  {errors.cityDisplay && <p className="text-xs text-destructive mt-1 ml-1">{errors.cityDisplay.message}</p>}
                  {errors.lat && !errors.cityDisplay && <p className="text-xs text-destructive mt-1 ml-1">Please select a valid city from the list.</p>}
                </div>

                <div className="pt-6">
                  <Button type="submit" isLoading={isPending} className="w-full group text-base h-14">
                    <span className="flex items-center gap-2">
                      Calculate Vertex
                      <Sparkles className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="text-center py-6 sm:py-10"
              >
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.3, duration: 0.8 }}
                  className="w-24 h-24 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
                >
                  <Sparkles className="w-10 h-10 text-primary" />
                </motion.div>

                <h2 className="text-sm sm:text-base text-muted-foreground font-medium mb-3 uppercase tracking-[0.2em]">
                  {calculationResult?.name ? `${calculationResult.name}'s Vertex` : "Your Vertex"}
                </h2>
                
                <div className="mb-10">
                  <div className="font-display text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-primary-foreground to-primary/80 mb-6 pb-2 leading-tight">
                    {calculationResult?.vertex_sign || "Unknown"}
                  </div>
                  
                  <div className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm sm:text-base font-medium tracking-wide shadow-inner">
                    {calculationResult?.vertex_degree_in_sign?.toFixed(2)}° in {calculationResult?.vertex_sign}
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto h-12 px-8">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Calculate Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
      </div>
    </div>
  );
}
