import { getColors as getAppleColors } from '../features/theme/constants/colors';

export const getColors = getAppleColors;
export const colors = getAppleColors(false);
export type AppColors = ReturnType<typeof getColors>;