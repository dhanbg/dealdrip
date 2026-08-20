import { z } from "zod";

export const PROVINCES = [
  "Bagmati Province",
  "Gandaki Province",
  "Koshi Province",
  "Lumbini Province",
  "Madhesh Province",
  "Karnali Province",
  "Sudurpashchim Province",
] as const;

export const POPULAR_CITIES = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Chitwan (Bharatpur)",
  "Biratnagar",
  "Dharan",
  "Butwal",
  "Hetauda",
  "Itahari",
  "Birgunj",
  "Nepalgunj",
  "Dhangadhi",
  "Birtamode",
] as const;

export const checkoutFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long"),
    phone: z
      .string()
      .trim()
      .min(10, "Please enter a valid 10-digit mobile number")
      .regex(
        /^(?:(?:\+?977[- ]?)?(9[678]\d{8}|\d{10}))$/,
        "Please enter a valid 10-digit Nepal mobile number (e.g. 98XXXXXXXX)"
      ),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .optional()
      .or(z.literal("")),
    province: z.string().min(1, "Please select a province"),
    city: z.string().min(1, "Please select your city"),
    customCity: z.string().trim().optional().or(z.literal("")),
    address: z
      .string()
      .trim()
      .min(5, "Please enter a detailed street address or landmark (min 5 characters)"),
    notes: z
      .string()
      .trim()
      .max(500, "Delivery notes cannot exceed 500 characters")
      .optional()
      .or(z.literal("")),
    paymentMethod: z.enum(["cod", "esewa", "banking_card"]),
    bankingSubtype: z.enum(["qr", "card"]).optional(),
    cardNumber: z.string().trim().optional().or(z.literal("")),
    cardExpiry: z.string().trim().optional().or(z.literal("")),
    cardCvc: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // Validate custom city if "Other" is selected
    if (data.city === "Other") {
      if (!data.customCity || data.customCity.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your city / district name",
          path: ["customCity"],
        });
      }
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const DEFAULT_CHECKOUT_VALUES: CheckoutFormValues = {
  fullName: "",
  phone: "",
  email: "",
  province: "Bagmati Province",
  city: "Kathmandu",
  customCity: "",
  address: "",
  notes: "",
  paymentMethod: "esewa",
  bankingSubtype: "qr",
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
};

