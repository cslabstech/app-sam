// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, keyof typeof MaterialIcons.glyphMap>;
type IconSymbolName = string;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  'house.fill': 'home',
  'building.2.fill': 'business',
  'building.2': 'business',
  'calendar.badge.clock': 'event',
  'person.fill': 'person',
  'lock.fill': 'lock',
  'escape': 'logout',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'person': 'person',
  'person-outline': 'person-outline',
  'logo-whatsapp': 'whatsapp',
  'alert-circle': 'error-outline',
  'send': 'send',
  'calendar': 'calendar-today',
  'business': 'business',
  'event': 'event',
  'code': 'code',
  'logout': 'logout',
  'exclamationmark.triangle.fill': 'warning',
  'exclamationmark.triangle': 'warning',
  'camera.fill': 'camera-alt',
  'person.badge.key.fill': 'admin-panel-settings',
  'info.circle': 'info',
  'photo': 'photo-camera',
  'video': 'videocam',
  'pencil': 'edit',
  'tag.fill': 'local-offer',
  'mappin.and.ellipse': 'location-on',
  'text.alignleft': 'format-align-left',
  'arrow.clockwise': 'refresh',
  'checkmark': 'check',
  'plus': 'add',
  'line.3.horizontal.decrease.circle': 'filter-list',
  'trash': 'delete',
  'checkmark-circle': 'check-circle',
  'close-circle': 'cancel',
  'shield.fill': 'security',
  'phone.fill': 'phone',
  'magnifyingglass': 'search',
  'xmark.circle.fill': 'cancel',
  'play.fill': 'play-arrow',
  'stop.fill': 'stop',
  'checkmark.circle.fill': 'check-circle',
  'bell.fill': 'notifications',
  'checkmark.seal.fill': 'verified',
  'calendar.badge.plus': 'event-available',
  'plus.circle.fill': 'add-circle',
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] || 'help-outline';
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
