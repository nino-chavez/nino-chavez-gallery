/**
 * Print Order API Endpoint
 *
 * POST /api/print/order - Create a new print order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPrintOrder, calculatePrintPrice, validatePrintOptions } from '@/lib/print/service';
import type { PrintOptions } from '@/lib/print/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      photoId,
      photoTitle,
      options,
      customerInfo,
      shippingSpeed = 'standard'
    } = body;

    // Validate required fields
    if (!photoId || !photoTitle || !options || !customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate print options
    const validation = validatePrintOptions(options as PrintOptions);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid print options', details: validation.errors },
        { status: 400 }
      );
    }

    // Verify photo exists and user has access
    const supabase = await createClient();
    const { data: photo } = await supabase
      .from('photos')
      .select('id, title, image_url')
      .eq('id', photoId)
      .single();

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Calculate pricing
    const pricing = calculatePrintPrice(options as PrintOptions, shippingSpeed);

    // Create order
    const order = await createPrintOrder(
      photoId,
      photoTitle,
      options as PrintOptions,
      customerInfo,
      shippingSpeed
    );

    // In real implementation, save to database
    // const { data: savedOrder, error } = await supabase
    //   .from('print_orders')
    //   .insert(order)
    //   .select()
    //   .single();

    // For now, return the calculated order
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        pricing
      }
    });

  } catch (error) {
    console.error('Print order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}