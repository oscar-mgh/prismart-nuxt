const parseOptionalAmount = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export const useCartShipping = () => {
  const config = useRuntimeConfig()

  const shippingFee = parseOptionalAmount(config.public.cartShippingFee, 90)
  const freeShippingThreshold = parseOptionalAmount(
    config.public.cartFreeShippingThreshold,
    400
  )

  const getShippingCost = (subtotal: number) =>
    subtotal >= freeShippingThreshold ? 0 : shippingFee

  const isShippingFree = (subtotal: number) =>
    subtotal >= freeShippingThreshold

  return {
    shippingFee,
    freeShippingThreshold,
    getShippingCost,
    isShippingFree
  }
}
