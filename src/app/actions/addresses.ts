'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserAddresses,
  AddressInput,
} from '@/db/queries/addresses';

async function assertUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Authentication required.');
  }

  return session.user;
}

export async function saveAddressAction(data: AddressInput & { id?: string }) {
  try {
    const user = await assertUser();

    if (data.id) {
      await updateUserAddress(data.id, user.id, data);
    } else {
      await createUserAddress(user.id, data);
    }

    revalidatePath('/account/addresses');
    revalidatePath('/checkout');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAddressAction(addressId: string) {
  try {
    const user = await assertUser();
    await deleteUserAddress(addressId, user.id);
    revalidatePath('/account/addresses');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getUserAddressesAction() {
  try {
    const user = await assertUser();
    const addrs = await getUserAddresses(user.id);
    return { success: true, addresses: addrs };
  } catch (err: any) {
    return { success: false, addresses: [], error: err.message };
  }
}

