<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeightRecord extends Model
{
    /** @use HasFactory<\Database\Factories\WeightRecordFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'time',
        'weight_kg',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'weight_kg' => 'decimal:2',
        ];
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
