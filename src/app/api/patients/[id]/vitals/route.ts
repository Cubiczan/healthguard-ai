import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/patients/[id]/vitals — Get vitals history for a patient
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = { patientId: id };

    if (startDate || endDate) {
      where.recordedAt = {} as Record<string, Date>;
      if (startDate) (where.recordedAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.recordedAt as Record<string, Date>).lte = new Date(endDate);
    }

    const vitals = await db.vitalsReading.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
    });

    return NextResponse.json(vitals);
  } catch (error) {
    console.error('Failed to fetch vitals:', error);
    return NextResponse.json({ error: 'Failed to fetch vitals' }, { status: 500 });
  }
}

// POST /api/patients/[id]/vitals — Add new vitals reading
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { heartRate, systolic, diastolic, temperature, spo2, notes } = body;

    const reading = await db.vitalsReading.create({
      data: {
        patientId: id,
        heartRate: heartRate ?? 72,
        systolic: systolic ?? 120,
        diastolic: diastolic ?? 80,
        temperature: temperature ?? 98.6,
        spo2: spo2 ?? 98,
        notes: notes || '',
      },
    });

    // Auto-generate alerts for abnormal vitals
    const newAlerts: Array<{ type: string; category: string; message: string; severity: number }> = [];

    if (systolic >= 160 || diastolic >= 100) {
      newAlerts.push({
        type: 'critical',
        category: 'vitals',
        message: `Severely elevated BP detected: ${systolic}/${diastolic} mmHg. Hypertensive crisis possible. Immediate physician review required.`,
        severity: 5,
      });
    } else if (systolic >= 140 || diastolic >= 90) {
      newAlerts.push({
        type: 'warning',
        category: 'vitals',
        message: `Elevated BP reading: ${systolic}/${diastolic} mmHg. Consider medication review.`,
        severity: 3,
      });
    }

    if (heartRate > 110) {
      newAlerts.push({
        type: 'warning',
        category: 'vitals',
        message: `Tachycardia detected: ${heartRate} bpm. Evaluate for underlying cause.`,
        severity: 3,
      });
    } else if (heartRate < 55) {
      newAlerts.push({
        type: 'warning',
        category: 'vitals',
        message: `Bradycardia detected: ${heartRate} bpm. Assess for symptoms.`,
        severity: 3,
      });
    }

    if (spo2 < 90) {
      newAlerts.push({
        type: 'critical',
        category: 'vitals',
        message: `Critically low SpO2: ${spo2}%. Immediate intervention needed.`,
        severity: 5,
      });
    } else if (spo2 < 93) {
      newAlerts.push({
        type: 'warning',
        category: 'vitals',
        message: `Low SpO2 reading: ${spo2}%. Monitor closely.`,
        severity: 3,
      });
    }

    if (temperature >= 101.0) {
      newAlerts.push({
        type: 'warning',
        category: 'vitals',
        message: `Fever detected: ${temperature}°F. Evaluate for infection.`,
        severity: 3,
      });
    }

    for (const alert of newAlerts) {
      await db.alert.create({
        data: { patientId: id, ...alert },
      });
    }

    return NextResponse.json({
      reading,
      alertsGenerated: newAlerts.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create vitals reading:', error);
    return NextResponse.json({ error: 'Failed to create vitals reading' }, { status: 500 });
  }
}
