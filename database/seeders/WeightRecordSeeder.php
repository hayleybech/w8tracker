<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WeightRecord;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class WeightRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::firstWhere('email', 'test@example.com') ?? User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $startDate = Carbon::now()->subMonths(6)->startOfDay();
        $endDate = Carbon::now()->startOfDay();
        $days = (int) $startDate->diffInDays($endDate);

        $startWeight = 85.0;
        $totalLoss = 5.0;
        $dailyLoss = $totalLoss / $days;

        for ($i = 0; $i <= $days; $i++) {
            $currentDate = $startDate->copy()->addDays($i);

            // Trend weight
            $trendWeight = $startWeight - ($dailyLoss * $i);

            // Small fluctuations (+/- 0.3kg)
            $fluctuation = (mt_rand(-30, 30) / 100);
            $weight = $trendWeight + $fluctuation;

            WeightRecord::create([
                'user_id' => $user->id,
                'date' => $currentDate->toDateString(),
                'time' => sprintf('%02d:%02d:00', mt_rand(7, 9), mt_rand(0, 59)),
                'weight_kg' => round($weight, 2),
            ]);
        }
    }
}
