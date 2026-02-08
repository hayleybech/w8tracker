<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WeightRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WeightRecordIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_see_their_weight_records_on_dashboard(): void
    {
        $user = User::factory()->create();
        $records = WeightRecord::factory()->count(3)->create([
            'user_id' => $user->id,
        ]);

        $otherUser = User::factory()->create();
        WeightRecord::factory()->count(2)->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('weightRecords', 3)
            ->where('weightRecords.0.user_id', $user->id)
        );
    }
}
