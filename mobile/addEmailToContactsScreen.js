const fs = require('fs');
let c = fs.readFileSync('src/screens/ContactsScreen.js', 'utf8');

// 1. Add email + notifyViaEmail to initial form state
c = c.replace(
  "const [form, setForm] = useState({ name: '', phone: '', relationship: '', notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false });",
  "const [form, setForm] = useState({ name: '', phone: '', email: '', relationship: '', notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false, notifyViaEmail: true });"
);

// 2. Relax validation: require name AND (phone OR email)
c = c.replace(
  "if (!form.name || !form.phone) return Alert.alert('Error', 'Name and phone required');",
  "if (!form.name || (!form.phone && !form.email)) return Alert.alert('Error', 'Name and at least one of phone or email is required');"
);

// 3. Reset form to include email fields after successful add
c = c.replace(
  "setForm({ name: '', phone: '', relationship: '', notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false });",
  "setForm({ name: '', phone: '', email: '', relationship: '', notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false, notifyViaEmail: true });"
);

// 4. Add email TextInput right after the phone input
c = c.replace(
  `<TextInput style={styles.input} placeholder="Phone (+91XXXXXXXXXX)" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />`,
  `<TextInput style={styles.input} placeholder="Phone (+91XXXXXXXXXX) - optional" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Email - optional" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" />`
);

// 5. Add Email toggle switch alongside SMS/WhatsApp/Call
c = c.replace(
  `<View style={styles.switchRow}><Text style={styles.switchLabel}>Call</Text><Switch value={form.notifyViaCall} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaCall: v }))} trackColor={{ true: '#3B82F6' }} /></View>`,
  `<View style={styles.switchRow}><Text style={styles.switchLabel}>Call</Text><Switch value={form.notifyViaCall} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaCall: v }))} trackColor={{ true: '#3B82F6' }} /></View>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>Email</Text><Switch value={form.notifyViaEmail} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaEmail: v }))} trackColor={{ true: '#F59E0B' }} /></View>`
);

// 6. Show email in the contact list channels display
c = c.replace(
  "{item.notifyViaSMS ? 'ðŸ“± SMS ' : ''}{item.notifyViaWhatsApp ? 'ðŸ’¬ WhatsApp ' : ''}{item.notifyViaCall ? 'ðŸ“ž Call' : ''}",
  "{item.notifyViaSMS ? 'ðŸ“± SMS ' : ''}{item.notifyViaWhatsApp ? 'ðŸ’¬ WhatsApp ' : ''}{item.notifyViaCall ? 'ðŸ“ž Call ' : ''}{item.notifyViaEmail && item.email ? 'ðŸ“§ Email' : ''}"
);

fs.writeFileSync('src/screens/ContactsScreen.js', c, 'utf8');
console.log('ContactsScreen.js updated with email support');
